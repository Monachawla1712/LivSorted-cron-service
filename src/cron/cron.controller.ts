import { Controller, Post, UseFilters } from '@nestjs/common';
import { CronService } from './cron.service';
import { HttpExceptionFilter } from '../core/http-exception.filter';
import { OrderService } from '../order/order.service';
import { StoreService } from '../store/store.service';
import { StoreEntity } from '../store/store.entity';
import { MmDeliveryService } from '../middleMileDelivery/mmDelivery.service';
import { OrderWeightBean } from '../order/classes/order-weight.bean';
import { MmDeliveryEntity } from '../middleMileDelivery/mmDelivery.entity';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Controller()
@UseFilters(HttpExceptionFilter)
export class CronController {
  private readonly logger = new CustomLogger(CronController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private cronService: CronService,
    private orderService: OrderService,
    private storeService: StoreService,
    private mmDeliveryService: MmDeliveryService,
  ) {}

  @Post('process/12am')
  async start12amCron() {
    this.logger.log(
      this.asyncContext.get('traceId'),
      '\n-------------------- 12AM Cron Started  ---------------------\n',
    );
    const aa = await this.cronService.start12amCron();
    return true;
  }

  @Post('franchise-order/routing')
  async franchiseOrderRouting() {
    const franchiseOrders =
      await this.orderService.getNewFranchiseOrdersForRouting();
    const whIdFranchiseOrdersMap = this.buildWhIdOrdersListMap(franchiseOrders);
    const storeWaitTimeMap = this.buildWaitTimeMap(franchiseOrders);
    for (const [whId, franchiseOrderList] of whIdFranchiseOrdersMap.entries()) {
      const storesList = await this.getStoresList(
        franchiseOrderList.map((franchiseOrder) => {
          return franchiseOrder.storeId;
        }),
      );
      const storeOrderMap = this.buildStoreOrderMap(franchiseOrderList);
      const routingArray =
        this.mmDeliveryService.createFranchiseOrdersRoutingData(
          storesList,
          storeWaitTimeMap,
          whId,
          storeOrderMap,
        );
      const storeIdMap = this.buildStoreIdMap(storesList);
      await this.mmDeliveryService.updateRouting(
        routingArray,
        storeOrderMap,
        whId,
        storeIdMap,
      );
    }
    return true;
  }

  private async getStoresList(storeIds: string[]) {
    const storesList =
      await this.storeService.getStoresFromStoreIdsAndWhDeliveryTime(storeIds);
    return storesList;
  }

  // private async getStoresIndexMap(stores: StoreEntity[]) {
  //   const storesMap = new Map<string, StoreEntity>();
  //   for (let i = 0; i < stores.length; i++) {
  //     storesMap.set(i, store);
  //   }
  //   return storesMap;
  // }

  private buildWhIdOrdersListMap(franchiseOrders: OrderWeightBean[]) {
    const ordersMap = new Map<string, OrderWeightBean[]>();
    for (const franchiseOrder of franchiseOrders) {
      if (ordersMap.has(franchiseOrder.whId)) {
        ordersMap.get(franchiseOrder.whId).push(franchiseOrder);
      } else {
        ordersMap.set(franchiseOrder.whId, [franchiseOrder]);
      }
    }
    return ordersMap;
  }

  private buildWaitTimeMap(franchiseOrders: OrderWeightBean[]) {
    const storesMap = new Map<string, number>();
    for (const franchiseOrder of franchiseOrders) {
      storesMap.set(
        franchiseOrder.storeId,
        Math.min(Math.ceil(this.getOrderWaitTime(franchiseOrder)) + 15, 45),
      );
    }
    return storesMap;
  }

  private getOrderWaitTime(franchiseOrder: OrderWeightBean) {
    const unloadingTime = franchiseOrder.orderWeight / 5;
    const bufferTime = 5;
    return unloadingTime + bufferTime;
  }

  private buildStoreOrderMap(franchiseOrderList: OrderWeightBean[]) {
    const ordersMap = new Map<string, OrderWeightBean>();
    for (const order of franchiseOrderList) {
      ordersMap.set(order.storeId, order);
    }
    return ordersMap;
  }

  private buildStoreIdMap(storesList: StoreEntity[]) {
    const storesMap = new Map<string, StoreEntity>();
    for (const store of storesList) {
      storesMap.set(store.store_id, store);
    }
    return storesMap;
  }

  @Post('franchise/routing-distance')
  async calculateRoutingDistance() {
    const mmDeliveryList =
      await this.mmDeliveryService.getLatestMmDeliveryEntries();
    const mmDeliveryRouteListMap =
      this.buildMmDeliveryRouteListMap(mmDeliveryList);
    const storesList = await this.getStoresList(
      mmDeliveryList.map((franchiseOrder) => {
        return franchiseOrder.storeId.toString();
      }),
    );
    const storeIdMap = this.buildStoreIdMap(storesList);
    const routingDistanceArray =
      await this.mmDeliveryService.createRoutingDistance(
        mmDeliveryRouteListMap,
        storeIdMap,
      );
    await this.mmDeliveryService.bulkUpsertMmdRoutingDistance(
      routingDistanceArray,
    );
    return true;
  }

  private buildMmDeliveryRouteListMap(mmDeliveryList: MmDeliveryEntity[]) {
    const mmDeliveryMap = new Map<number, MmDeliveryEntity[]>();
    for (const mmDelivery of mmDeliveryList) {
      if (mmDeliveryMap.has(mmDelivery.route)) {
        mmDeliveryMap.get(mmDelivery.route).push(mmDelivery);
      } else {
        mmDeliveryMap.set(mmDelivery.route, [mmDelivery]);
      }
    }
    return mmDeliveryMap;
  }
}
