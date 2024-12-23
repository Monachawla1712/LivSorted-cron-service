import { Controller, Post, UseFilters } from '@nestjs/common';
import { HttpExceptionFilter } from '../core/http-exception.filter';
import { StoreService } from './store.service';
import { InventoryService } from './inventory.service';
import { ProductEntity } from './product.entity';
import { LithosCatalogueResponse } from './classes/lithosCatalogueResponse';
import { InventoryEntity } from './inventory.entity';
import { OrderService } from '../order/order.service';
import { OrderParamsService } from '../order-params/order-params.service';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Controller('store')
@UseFilters(HttpExceptionFilter)
export class StoreCronController {
  private readonly logger = new CustomLogger(StoreCronController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private storeService: StoreService,
    private inventoryService: InventoryService,
    private orderService: OrderService,
    private orderParamsService: OrderParamsService,
  ) {}

  @Post('/sync/lithos-catalogue')
  async syncLithosCatalogueByStores() {
    const storeList = await this.storeService.getOpenStores();
    const products = await this.inventoryService.getAllProducts();
    const lithosRefToSkuCodeMap = this.createLithosIdToSkuCodeMap(products);
    for (const store of storeList) {
      if (store.lithos_ref != null && store.lithos_ref != 0) {
        try {
          const lithosCatalogue = await this.storeService.getLithosCatalogue(
            store.lithos_ref,
          );
          if (
            lithosCatalogue == null ||
            lithosCatalogue.catalogueList.length === 0
          ) {
            this.logger.log(
              this.asyncContext.get('traceId'),
              'No Catalogue found for Lithos Ref Id : ' + store.lithos_ref,
            );
          }
          const lithosSalePriceMap = await this.getLithosSalePriceMap(
            lithosCatalogue,
            lithosRefToSkuCodeMap,
          );
          const storeInventory = await this.inventoryService.getStoreInventory(
            store.store_id,
          );
          this.packDataForPricingUpdate(storeInventory, lithosSalePriceMap);

          await this.inventoryService.updatePricingFromLithosCatalogue(
            storeInventory,
          );
        } catch (e) {
          this.logger.error(
            this.asyncContext.get('traceId'),
            'SOMETHING WENT WRONG WHILE UPDATING INVENTORY FOR STORE: ' +
              store.store_id,
            e,
          );
        }
      } else {
        this.logger.log(
          this.asyncContext.get('traceId'),
          'STORE ' + store.store_id + ' DOES NOT HAVE A LITHOS REFERENCE ID',
        );
      }
    }
    return true;
  }

  private createLithosIdToSkuCodeMap(products: ProductEntity[]) {
    const lithosRefToSkuCode = new Map<number, string>();
    for (const product of products) {
      if (product.lithos_ref != null) {
        lithosRefToSkuCode.set(product.lithos_ref, product.sku_code);
      }
    }
    return lithosRefToSkuCode;
  }

  private packDataForPricingUpdate(
    storeInventory: InventoryEntity[],
    skuCodeToSPMap: Map<string, number>,
  ) {
    for (const inventory of storeInventory) {
      if (skuCodeToSPMap.get(inventory.sku_code) != null) {
        inventory.sale_price = skuCodeToSPMap.get(inventory.sku_code);
      }
    }
  }

  private async getLithosSalePriceMap(
    lithosCatalogue: LithosCatalogueResponse,
    lithosRefToSkuCodeMap: Map<number, string>,
  ) {
    const skuCodeToSPMap = new Map<string, number>();
    for (const catalogue of lithosCatalogue.catalogueList) {
      skuCodeToSPMap.set(
        lithosRefToSkuCodeMap.get(catalogue.Id),
        catalogue.SaleRate,
      );
    }
    return skuCodeToSPMap;
  }

  @Post('inventory-view/recheck')
  async recheckInventoryView() {
    const n = await this.orderParamsService.getNumberParamValue(
      'INVENTORY_VIEW_N_DAYS',
      14,
    );
    const creationDays = await this.orderParamsService.getNumberParamValue(
      'INVENTORY_VIEW_CREATION_N_DAYS',
      14,
    );
    const storeIds: string[] =
      await this.orderService.getLastNDaysDistinctActiveStores(n);
    const LnStoreIdsList: string[] =
      await this.storeService.getLastNDaysNewStores(creationDays);
    const storesSet = new Set(storeIds.concat(LnStoreIdsList));
    await this.storeService.setInventoryViewHiddenForNotInList(
      Array.from(storesSet),
    );
    return true;
  }

  @Post('product/reset-videos')
  async resetProductVideos() {
    await this.inventoryService.removeAllProductVideos();
    return { success: true, message: 'product videos removed' };
  }
}
