import { Module } from '@nestjs/common';
import { MmDeliveryService } from './mmDelivery.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { OrderService } from '../order/order.service';
import { MmRoutingTableEntity } from './mmRoutingTable.entity';
import { OrderEntity } from 'src/order/order.entity';
import { OrderItemsEntity } from 'src/order/order-items.entity';
import { FranchiseOrderEntity } from '../order/franchise-order.entity';
import { MmRoutesDistanceEntity } from './mmRoutesDistance.entity';
import { MmDeliveryEntity } from './mmDelivery.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemsEntity,
      FranchiseOrderEntity,
    ]),
    TypeOrmModule.forFeature(
      [MmRoutingTableEntity, MmRoutesDistanceEntity, MmDeliveryEntity],
      'warehouseDB',
    ),
  ],
  providers: [MmDeliveryService, ConfigService, OrderService],
})
export class MmDeliveryModule {}
