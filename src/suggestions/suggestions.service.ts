import { In, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { SuggestionEntity } from './suggestions.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FrequencyAndAvgQty } from './classes/event-conditions';
import { StoreService } from '../store/store.service';
import { OrderService } from '../order/order.service';
import { OrderParamsService } from '../order-params/order-params.service';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Injectable()
export class SuggestionsService {
  private readonly logger = new CustomLogger(SuggestionsService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(SuggestionEntity)
    private readonly suggestionRepository: Repository<SuggestionEntity>,
    private storeService: StoreService,
    private orderService: OrderService,
    private orderParamsService: OrderParamsService,
  ) {}

  private async getStoreFavorites(storeIds: string[], suggestionType) {
    return await this.suggestionRepository.find({
      where: {
        entityId: In(storeIds),
        active: 1,
        suggestionType: suggestionType,
      },
    });
  }

  async updateFavorites(userId: string) {
    const averageDays = await this.orderParamsService.getNumberParamValue(
      'ORDER_AVERAGE_DAYS',
      7,
    );
    const favoriteCount = await this.orderParamsService.getNumberParamValue(
      'FAVORITE_COUNT',
      5,
    );
    const itemsFrequency =
      await this.orderService.getFranchiseOrderItemsFrequencyByDays(
        averageDays,
        favoriteCount,
      );
    const itemsAverageQty =
      await this.orderService.getFranchiseOrderItemsAverageQtyByDays(
        averageDays,
      );
    const storeSkuAverageMap = await this.getItemsFrequencyAvgQtyMap(
      itemsFrequency,
      itemsAverageQty,
    );
    const favorites = await this.getStoreFavorites(
      Array.from(storeSkuAverageMap.keys()),
      'FAVORITE',
    );
    const favoritesMap = new Map<string, Set<string>>();
    const updateList = [];
    for (const favorite of favorites) {
      if (
        !storeSkuAverageMap.has(favorite.entityId) ||
        !storeSkuAverageMap.get(favorite.entityId).has(favorite.skuCode)
      ) {
        favorite.active = 0;
        updateList.push(favorite);
      } else {
        const updatedQuantity = Math.ceil(
          storeSkuAverageMap.get(favorite.entityId).get(favorite.skuCode)
            .avgQty,
        ).toString();
        if (Math.ceil(Number(favorite.quantity)) != Number(updatedQuantity)) {
          favorite.quantity = updatedQuantity;
          updateList.push(favorite);
        }
        storeSkuAverageMap.get(favorite.entityId).delete(favorite.skuCode);
        if (storeSkuAverageMap.get(favorite.entityId).size < 1) {
          storeSkuAverageMap.delete(favorite.entityId);
        }
        if (favoritesMap.has(favorite.entityId)) {
          favoritesMap.get(favorite.entityId).add(favorite.skuCode);
        } else {
          favoritesMap.set(
            favorite.entityId,
            new Set<string>([favorite.skuCode]),
          );
        }
      }
    }

    for (const [storeId, skuMap] of storeSkuAverageMap.entries()) {
      for (const [skuCode, freqAvgQty] of skuMap.entries()) {
        const favorite = new SuggestionEntity(
          'STORE',
          storeId,
          skuCode,
          freqAvgQty.avgQty.toString(),
          'FAVORITE',
          userId,
        );
        updateList.push(favorite);
        if (favoritesMap.has(favorite.entityId)) {
          favoritesMap.get(favorite.entityId).add(favorite.skuCode);
        } else {
          favoritesMap.set(
            favorite.entityId,
            new Set<string>([favorite.skuCode]),
          );
        }
      }
    }
    await this.suggestionRepository.save(updateList);
    return favoritesMap;
  }

  async setSuggestions(favoritesMap: Map<string, Set<string>>, userId: string) {
    const storeIds = Array.from(favoritesMap.keys());
    const similarStoresMap = await this.storeService.nearestStoresMap(
      5,
      storeIds,
    );
    const suggestionsLimit = await this.orderParamsService.getNumberParamValue(
      'SUGGESTIONS_LIMIT',
      5,
    );
    const newSuggestionsMap = this.buildSuggestionsMap(
      similarStoresMap,
      favoritesMap,
      suggestionsLimit,
    );
    await this.updateSuggestions(newSuggestionsMap, userId);
    return true;
  }

  private buildSuggestionsMap(
    similarStoresMap: Map<string, Set<string>>,
    favoritesMap: Map<string, Set<string>>,
    suggestionsLimit: number,
  ) {
    const suggestionsMap = new Map<string, Set<string>>();
    for (const [store, similarStores] of similarStoresMap.entries()) {
      for (const similarStore of similarStores.keys()) {
        if (favoritesMap.has(similarStore)) {
          for (const favSku of favoritesMap.get(similarStore)) {
            if (
              favoritesMap.has(store) &&
              !favoritesMap.get(store).has(favSku)
            ) {
              if (
                suggestionsMap.has(store) &&
                suggestionsMap.get(store).size >= suggestionsLimit
              ) {
                continue;
              }
              if (suggestionsMap.has(store)) {
                suggestionsMap.get(store).add(favSku);
              } else {
                suggestionsMap.set(store, new Set<string>([favSku]));
              }
            }
          }
        }
      }
    }
    return suggestionsMap;
  }

  private async updateSuggestions(
    newSuggestionsMap: Map<string, Set<string>>,
    userId: string,
  ) {
    const suggestions = await this.getStoreFavorites(
      Array.from(newSuggestionsMap.keys()),
      'SUGGESTION',
    );
    for (const suggestion of suggestions) {
      if (
        !newSuggestionsMap.has(suggestion.entityId) ||
        !newSuggestionsMap.get(suggestion.entityId).has(suggestion.skuCode)
      ) {
        suggestion.active = 0;
      } else {
        newSuggestionsMap.get(suggestion.entityId).delete(suggestion.skuCode);
        if (newSuggestionsMap.get(suggestion.entityId).size < 1) {
          newSuggestionsMap.delete(suggestion.entityId);
        }
      }
    }
    for (const [storeId, skuMap] of newSuggestionsMap.entries()) {
      for (const skuCode of skuMap.keys()) {
        const suggestion = new SuggestionEntity(
          'STORE',
          storeId,
          skuCode,
          null,
          'SUGGESTION',
          userId,
        );
        suggestions.push(suggestion);
      }
    }
    await this.suggestionRepository.save(suggestions);
    return true;
  }

  private async getItemsFrequencyAvgQtyMap(
    itemsFrequency: { store_id: string; sku_code: string; count: number }[],
    itemsAverageQty: {
      store_id: string;
      sku_code: string;
      numOrders: number;
      avg_quantity_per_order: number;
    }[],
  ) {
    const mm = new Map<string, Map<string, FrequencyAndAvgQty>>();
    for (const freqItem of itemsFrequency) {
      const aa = new FrequencyAndAvgQty();
      aa.freq = freqItem.count;
      if (mm.has(freqItem.store_id)) {
        mm.get(freqItem.store_id).set(freqItem.sku_code, aa);
      } else {
        const gg = new Map<string, FrequencyAndAvgQty>();
        gg.set(freqItem.sku_code, aa);
        mm.set(freqItem.store_id, gg);
      }
    }
    for (const avgQtyItem of itemsAverageQty) {
      if (
        mm.has(avgQtyItem.store_id) &&
        mm.get(avgQtyItem.store_id).has(avgQtyItem.sku_code)
      ) {
        mm.get(avgQtyItem.store_id).get(avgQtyItem.sku_code).avgQty =
          avgQtyItem.avg_quantity_per_order;
      }
    }
    return mm;
  }
}
