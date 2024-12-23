import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { OrderService } from '../order/order.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { MmRoutingTableEntity } from './mmRoutingTable.entity';
import { StoreEntity } from '../store/store.entity';
import { OrderWeightBean } from '../order/classes/order-weight.bean';
import { MmDeliveryEntity } from './mmDelivery.entity';
import { MmRoutesDistanceEntity } from './mmRoutesDistance.entity';
import axios from 'axios';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Injectable()
export class MmDeliveryService {
  private readonly logger = new CustomLogger(MmDeliveryService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private configService: ConfigService,
    private orderService: OrderService,
    @InjectRepository(MmRoutingTableEntity, 'warehouseDB')
    private readonly mmRoutingRepository: Repository<MmRoutingTableEntity>,
    @InjectRepository(MmDeliveryEntity, 'warehouseDB')
    private readonly mmDeliveryRepository: Repository<MmDeliveryEntity>,
    @InjectRepository(MmRoutesDistanceEntity, 'warehouseDB')
    private readonly mmRoutesDistanceRepository: Repository<MmRoutesDistanceEntity>,
  ) {}

  async createMmDeliveryRoute() {
    return true;
  }

  createFranchiseOrdersRoutingData(
    storesList: StoreEntity[],
    storeWaitTimeMap: Map<string, number>,
    whId: string,
    ordersMap: Map<string, OrderWeightBean>,
  ) {
    storesList.sort((store1, store2) => {
      const openTime1 =
        store1.deliveryOpenTime != null
          ? this.convertTimeToNumber(store1.deliveryOpenTime)
          : 0;
      const openTime2 =
        store2.deliveryOpenTime != null
          ? this.convertTimeToNumber(store2.deliveryOpenTime)
          : 0;
      return openTime1 - openTime2;
    });

    const storeIndexMap = this.buildStoreIndexMap(storesList);
    const distanceMatrix = this.buildDistanceMatrix(storesList);
    const unvisitedSet = this.buildUnvisitedSet(storesList);

    const routingArray: string[][] = [];

    while (unvisitedSet.size > 0) {
      let currStore = [...unvisitedSet.values()][0];
      unvisitedSet.delete(currStore);
      const routeSequence = [currStore];
      let storeNum = 1;
      let currTime = this.convertTimeToNumber(
        storesList.at(storeIndexMap.get(currStore)).deliveryOpenTime,
      );
      let currWt = Number(ordersMap.get(currStore).orderWeight);
      for (const store of storesList) {
        if (storeNum >= 3) {
          break;
        }
        if (store.store_id != currStore && unvisitedSet.has(store.store_id)) {
          const distance = Number(
            distanceMatrix[storeIndexMap.get(store.store_id)][
              storeIndexMap.get(currStore)
            ],
          );
          const nextStoreOrderWeight = Number(
            ordersMap.get(store.store_id).orderWeight,
          );
          const whDeliveryOpenTime = Math.min(
            this.convertTimeToNumber(store.deliveryOpenTime),
            480,
          );
          if (
            whDeliveryOpenTime >
            currTime + (distance * 6) / 1000 + storeWaitTimeMap.get(currStore)
          ) {
            if (Number(currWt + nextStoreOrderWeight) <= 800) {
              routeSequence.push(store.store_id);
              unvisitedSet.delete(store.store_id);
              storeNum += 1;
              currTime = this.convertTimeToNumber(store.deliveryOpenTime);
              currStore = store.store_id;
              currWt += nextStoreOrderWeight;
            }
          }
        }
      }
      routingArray.push(routeSequence);
    }

    // const routingData = this.buildRoutingEntities(routingArray, whId);
    // const routingArray = this.getRouteArray(storesList);
    return routingArray;
  }

  convertTimeToNumber(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':');
    const timeNumber = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
    return timeNumber;
  }

  private async buildDistanceMatrix(storesList: StoreEntity[]) {
    const n = storesList.length;
    const distanceMatrix: number[][] = Array.from({ length: n }, () =>
      Array(n).fill(0),
    );
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const coords1 = storesList[i].location['coordinates'];
          const coords2 = storesList[j].location['coordinates'];
          distanceMatrix[i][j] = await this.calculateDistance(
            coords1[1],
            coords1[0],
            coords2[1],
            coords2[0],
          );
        }
      }
    }

    return distanceMatrix;
  }

  async calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): Promise<number> {
    // return getDistance(
    //   { latitude: lat1, longitude: lon1 },
    //   { latitude: lat2, longitude: lon2 },
    // );
    const rr = await this.getDistanceViaGoogleApi(lat1, lon1, lat2, lon2);
    return rr;
  }

  async getDistanceViaGoogleApi(lat1, lon1, lat2, lon2) {
    const origin = `${lat1},${lon1}`;
    const destination = `${lat2},${lon2}`;
    const apiKey = this.configService.get<string>('google_maps_api_key');
    const mode = 'bus';
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}&mode=${mode}`;
    const axiosOptions = {
      url: url,
      method: 'GET',
    };
    const result = await axios(axiosOptions);
    const dist = result.data.routes[0].legs[0].distance.value;
    return Number(dist);
  }
  private buildStoreIndexMap(storesList: StoreEntity[]) {
    const storeIndexMap = new Map<string, number>();
    for (let i = 0; i < storesList.length; i++) {
      storeIndexMap.set(storesList[i].store_id, i);
    }
    return storeIndexMap;
  }

  private buildUnvisitedSet(storesList: StoreEntity[]) {
    return new Set<string>(
      storesList.map((store) => {
        return store.store_id;
      }),
    );
  }

  async updateRouting(
    routingArray: string[][],
    storeOrderMap: Map<string, OrderWeightBean>,
    whId: string,
    storeIdMap: Map<string, StoreEntity>,
  ) {
    const routeList = [];
    for (let routeNum = 1; routeNum <= routingArray.length; routeNum++) {
      const storeCoordinates = storeIdMap.get(routingArray.at(routeNum - 1)[0])
        .location['coordinates'];
      const delTime = this.convertTimeToNumber(
        storeIdMap.get(routingArray.at(routeNum - 1)[0]).deliveryOpenTime,
      );
      const delTravelTime =
        ((await this.calculateDistance(
          storeCoordinates[1],
          storeCoordinates[0],
          28.49679,
          76.990072,
        )) *
          6) /
        1000;
      const dispatchTimeNumber =
        delTime - delTravelTime > 0 ? delTime - delTravelTime : 270;
      const dispatchTime = this.convertNumberToTime(dispatchTimeNumber);
      for (const storeId of routingArray.at(routeNum - 1)) {
        const routeEntity = MmRoutingTableEntity.newInstance(
          routeNum,
          Number(whId),
          storeOrderMap.get(storeId).deliveryDate,
          Number(storeId),
          storeOrderMap.get(storeId).slot,
          'NOT_ASSIGNED',
          storeIdMap.get(storeId).deliveryOpenTime,
          dispatchTime,
        );
        routeList.push(routeEntity);
      }
    }
    await this.mmRoutingRepository.save(routeList);
  }

  convertNumberToTime(timeNumber: number): string {
    const hours = Math.floor(timeNumber / 60);
    const minutes = Math.floor(timeNumber % 60);
    const timeStr = `${this.padZero(hours)}:${this.padZero(minutes)}`;
    return timeStr;
  }

  private padZero(num: number): string {
    return num.toString().padStart(2, '0');
  }

  async getLatestMmDeliveryEntries() {
    const deliveryDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    return await this.mmDeliveryRepository.find({
      where: { deliveryDate: deliveryDate, slot: this.getSlot() },
      order: { storeOpeningTime: 'asc' },
    });
  }

  getSlot(): string {
    const currentTime = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const currentHour = currentTime.getHours();
    if (currentHour < 12) {
      return 'MORNING_7_AM';
    } else {
      return 'MORNING_7_AM';
    }
  }

  async createRoutingDistance(
    mmDeliveryRouteListMap: Map<number, MmDeliveryEntity[]>,
    storeIdMap: Map<string, StoreEntity>,
  ) {
    const routesDistanceArray: MmRoutesDistanceEntity[] = [];
    for (const [
      routeNum,
      mmDeliveryEntries,
    ] of mmDeliveryRouteListMap.entries()) {
      const routesDistance = await this.getRoutesDistanceEntry(
        routeNum,
        mmDeliveryEntries,
        storeIdMap,
      );
      if (routesDistance != null) {
        routesDistanceArray.push(routesDistance);
      }
    }
    return routesDistanceArray;
  }

  async bulkUpsertMmdRoutingDistance(
    routingDistanceArray: MmRoutesDistanceEntity[],
  ) {
    await this.mmRoutesDistanceRepository.upsert(routingDistanceArray, [
      'whId',
      'route',
      'deliveryDate',
      'slot',
    ]);
  }

  private async getRoutesDistanceEntry(
    routeNum: number,
    mmDeliveryEntries: MmDeliveryEntity[],
    storeIdMap: Map<string, StoreEntity>,
  ) {
    try {
      for (const mmDelivery of mmDeliveryEntries) {
        const store = storeIdMap.get(mmDelivery.storeId.toString());
        if (store.location == null || store.location['coordinates'] == null) {
          return null;
        }
      }
      let lat1 = 28.49679;
      let lon1 = 76.990072;
      let distance = await this.calculateDistance(
        lat1,
        lon1,
        storeIdMap.get(
          mmDeliveryEntries[mmDeliveryEntries.length - 1].storeId.toString(),
        ).location['coordinates'][1],
        storeIdMap.get(
          mmDeliveryEntries[mmDeliveryEntries.length - 1].storeId.toString(),
        ).location['coordinates'][0],
      );
      if (mmDeliveryEntries.length == 1) {
        return MmRoutesDistanceEntity.newInstance(
          mmDeliveryEntries[0].deliveryDate,
          mmDeliveryEntries[0].slot,
          routeNum,
          mmDeliveryEntries[0].whId,
          mmDeliveryEntries[0].userId,
          2 * distance,
        );
      }
      for (const mmDelivery of mmDeliveryEntries) {
        const store = storeIdMap.get(mmDelivery.storeId.toString());
        const lat2 = store.location['coordinates'][1];
        const lon2 = store.location['coordinates'][0];
        distance += await this.calculateDistance(lat1, lon1, lat2, lon2);
        lat1 = lat2;
        lon1 = lon2;
      }
      return MmRoutesDistanceEntity.newInstance(
        mmDeliveryEntries[0].deliveryDate,
        mmDeliveryEntries[0].slot,
        routeNum,
        mmDeliveryEntries[0].whId,
        mmDeliveryEntries[0].userId,
        distance,
      );
    } catch (e) {
      return null;
    }
  }
}
