import { Module } from '@nestjs/common';
import { CommonService } from '../core/common/common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderEntity } from './order.entity';
import { OrderItemsEntity } from './order-items.entity';
import { FranchiseOrderEntity } from './franchise-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemsEntity,
      FranchiseOrderEntity,
    ]),
  ],
  providers: [OrderService, CommonService],
})
export class OrderModule {}
