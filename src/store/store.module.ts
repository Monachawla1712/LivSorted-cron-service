import { Module } from '@nestjs/common';
import { CommonService } from '../core/common/common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryEntity } from './inventory.entity';
import { ProductEntity } from './product.entity';
import { StoreCronController } from './store-cron.controller';
import { StoreService } from './store.service';
import { StoreEntity } from './store.entity';
import { ConfigService } from '@nestjs/config';
import { SuggestionEntity } from '../suggestions/suggestions.entity';
import { OrderService } from '../order/order.service';
import { OrderEntity } from '../order/order.entity';
import { FranchiseOrderEntity } from '../order/franchise-order.entity';
import { OrderItemsEntity } from '../order/order-items.entity';
import { FranchiseOrderItemEntity } from '../order/franchise-order-item.entity';
import { OrderParamsService } from '../order-params/order-params.service';
import { OrderParamsEntity } from '../order-params/order-params.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryEntity,
      ProductEntity,
      StoreEntity,
      SuggestionEntity,
      OrderEntity,
      FranchiseOrderEntity,
      OrderItemsEntity,
      FranchiseOrderItemEntity,
      OrderParamsEntity,
    ]),
  ],
  providers: [
    InventoryService,
    CommonService,
    StoreService,
    ConfigService,
    OrderService,
    OrderParamsService,
  ],
  controllers: [StoreCronController],
})
export class StoreModule {}
