import { IsNull, Not, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InventoryEntity } from './inventory.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from './product.entity';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Injectable()
export class InventoryService {
  private readonly logger = new CustomLogger(InventoryService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(InventoryEntity)
    private readonly inventoryRepository: Repository<InventoryEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async releaseInventory(storeId, skuCode, quantity) {
    const inventory = await this.inventoryRepository.findOne({
      where: { store_id: storeId, sku_code: skuCode },
    });
    inventory.quantity = inventory.quantity + quantity;
    await this.inventoryRepository.save(inventory);
    return true;
  }

  async getProductDetailsFromSkuCode(skuCode: string) {
    const product = await this.productRepository.findOne({
      where: { sku_code: skuCode },
    });
    return product;
  }

  async updatePricingFromLithosCatalogue(storeInventory: InventoryEntity[]) {
    const listUpdate = await this.inventoryRepository.save(storeInventory);
    return;
  }

  async getAllProducts() {
    const product = await this.productRepository.find({
      where: { is_active: true },
    });
    return product;
  }

  async getStoreInventory(id: string) {
    return await this.inventoryRepository.find({
      where: { store_id: id, is_active: true },
    });
  }

  async removeAllProductVideos() {
    await this.productRepository.update(
      { videos: Not(IsNull()) },
      { videos: null },
    );
  }
}
