import { DataSource, In, IsNull, MoreThan, Not, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreEntity } from './store.entity';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { LithosCatalogueResponse } from './classes/lithosCatalogueResponse';
import { InventoryView } from './enum/inventory-view.enum';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Injectable()
export class StoreService {
  private readonly logger = new CustomLogger(StoreService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    private readonly configService: ConfigService,
    private dataSource: DataSource,
  ) {}

  async getOpenStores() {
    const aa = this.storeRepository.find({
      where: { isActive: true, is_open: true },
    });
    return aa;
  }

  async getLithosCatalogue(
    lithos_ref: number,
  ): Promise<LithosCatalogueResponse> {
    try {
      const pyUtilUrl =
        this.configService.get('util_url') +
        `/util/internal/lithos/store/${lithos_ref}`;
      const axiosOptions = {
        url: pyUtilUrl,
        method: 'GET',
        headers: {
          Authorization: this.configService.get('util_token'),
        },
      };
      const result = await axios(axiosOptions);
      this.logger.log(
        this.asyncContext.get('traceId'),
        JSON.stringify(result.data),
      );
      return result.data;
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while getLithosCatalogue',
        e,
      );
    }
    return null;
  }

  async getNearestStoresGroups(limit: number) {
    const stores = (await this.dataSource.query(
      'SELECT \n' +
        '  s1.store_id, \n' +
        '  s2.store_id AS nearby_store_id, \n' +
        '  ST_Distance(s1.location::geography, s2.location::geography) AS distance\n' +
        'FROM store.stores s1\n' +
        'CROSS JOIN LATERAL (\n' +
        '  SELECT store_id , location\n' +
        '  FROM store.stores s2\n' +
        '  WHERE s2.id != s1.id \n' +
        '  and s1.is_active = true \n' +
        '  and s2.is_active = true\n' +
        '  and s1."location" is not null \n' +
        '  and s2."location" is not null \n' +
        '  and s1.status > 0 \n' +
        '  and s2.status > 0\n' +
        '  ORDER BY s1.location <-> s2.location\n' +
        '  LIMIT ' +
        limit.toString() +
        '\n' +
        ') AS s2;',
    )) as unknown as {
      store_id: string;
      nearby_store_id: string;
      distance: string;
    }[];

    return stores;
  }

  async nearestStoresMap(limit: number, storeIds: string[]) {
    const nearbyStoresList = await this.getNearestStoresGroups(limit);
    const nearbyMap = new Map<string, Set<string>>();
    for (const storeAndNearbyStore of nearbyStoresList) {
      if (nearbyMap.has(storeAndNearbyStore.store_id)) {
        nearbyMap
          .get(storeAndNearbyStore.store_id)
          .add(storeAndNearbyStore.nearby_store_id);
      } else {
        nearbyMap.set(
          storeAndNearbyStore.store_id,
          new Set<string>([storeAndNearbyStore.nearby_store_id]),
        );
      }
    }
    return nearbyMap;
  }

  async getStoresFromStoreIds(leaderboard: string[]) {
    return await this.storeRepository.find({
      where: {
        store_id: In(leaderboard),
        isActive: true,
      },
    });
  }

  async getStoresFromStoreIdsAndWhDeliveryTime(storeIds: string[]) {
    return await this.storeRepository.find({
      where: {
        store_id: In(storeIds),
        isActive: true,
        deliveryOpenTime: Not(IsNull()),
        location: Not(IsNull()),
      },
    });
  }

  getStoresMap(stores: StoreEntity[]) {
    const storesMap = new Map<string, StoreEntity>();
    for (const store of stores) {
      storesMap.set(store.store_id, store);
    }
    return storesMap;
  }

  async setInventoryViewHiddenForNotInList(storeIds: string[]) {
    await this.storeRepository.update(
      { store_id: Not(In(storeIds)) },
      { inventoryView: InventoryView.HIDDEN },
    );
  }

  async getLastNDaysNewStores(n: number) {
    const currDate = new Date();
    const diffDate = new Date();
    diffDate.setDate(currDate.getDate() - n);
    return (
      await this.storeRepository.find({
        where: {
          status: 1,
          isActive: true,
          createdAt: MoreThan(diffDate),
        },
      })
    ).map((store) => {
      return store.store_id;
    });
  }
}
