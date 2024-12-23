import { Module } from '@nestjs/common';
import { PpdService } from './ppd.service';
import { PpdController } from './ppd.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { OrderService } from '../order/order.service';
import { PpdEntity } from './ppd.entity';
import { OrderEntity } from 'src/order/order.entity';
import { OrderItemsEntity } from 'src/order/order-items.entity';
import { PpdDispatchEntity } from './ppd-dispatch.entity';
import { PpdPickersPackersSupervisorsEntity } from './ppd-pickers-packers-supervisors.entity';
import { FranchiseOrderEntity } from '../order/franchise-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemsEntity,
      FranchiseOrderEntity,
    ]),
    TypeOrmModule.forFeature(
      [PpdEntity, PpdDispatchEntity, PpdPickersPackersSupervisorsEntity],
      'warehouseDB',
    ),
  ],
  providers: [PpdService, ConfigService, OrderService],
  controllers: [PpdController],
})
export class PpdModule {}
