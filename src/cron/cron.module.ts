import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { OrderService } from '../order/order.service';
import { OrderEntity } from '../order/order.entity';
import { WalletService } from '../wallet/wallet.service';
import { WalletEntity } from '../wallet/wallet.entity';
import { OrderParamsService } from '../order-params/order-params.service';
import { OrderParamsEntity } from '../order-params/order-params.entity';
import { InventoryService } from '../store/inventory.service';
import { FailedOrderService } from '../failed-order/failed-order.service';
import { OrderItemsEntity } from '../order/order-items.entity';
import { InventoryEntity } from '../store/inventory.entity';
import { FailedOrderEntity } from '../failed-order/failed-order.entity';
import { PpdService } from '../ppd/ppd.service';
import { PpdEntity } from '../ppd/ppd.entity';
import { ProductEntity } from '../store/product.entity';
import { PpdDispatchEntity } from '../ppd/ppd-dispatch.entity';
import { PpdPickersPackersSupervisorsEntity } from '../ppd/ppd-pickers-packers-supervisors.entity';
import { NotificationService } from '../core/notification/notification.service';
import { HttpModule } from '@nestjs/axios';
import { FranchiseOrderEntity } from '../order/franchise-order.entity';
import { StoreService } from '../store/store.service';
import { StoreEntity } from '../store/store.entity';
import { MmDeliveryService } from '../middleMileDelivery/mmDelivery.service';
import { MmRoutingTableEntity } from '../middleMileDelivery/mmRoutingTable.entity';
import { MmRoutesDistanceEntity } from '../middleMileDelivery/mmRoutesDistance.entity';
import { MmDeliveryEntity } from '../middleMileDelivery/mmDelivery.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      WalletEntity,
      OrderParamsEntity,
      OrderItemsEntity,
      InventoryEntity,
      FailedOrderEntity,
      ProductEntity,
      FranchiseOrderEntity,
      StoreEntity,
    ]),
    TypeOrmModule.forFeature(
      [
        PpdEntity,
        PpdDispatchEntity,
        PpdPickersPackersSupervisorsEntity,
        MmRoutingTableEntity,
        MmRoutesDistanceEntity,
        MmDeliveryEntity,
      ],
      'warehouseDB',
    ),
    HttpModule,
  ],
  providers: [
    CronService,
    ConfigService,
    OrderService,
    WalletService,
    OrderParamsService,
    InventoryService,
    FailedOrderService,
    PpdService,
    NotificationService,
    StoreService,
    MmDeliveryService,
  ],
  controllers: [CronController],
})
export class CronModule {}
