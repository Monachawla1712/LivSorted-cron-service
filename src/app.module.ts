import { StoreModule } from './store/store.module';

require('newrelic');
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { CronModule } from './cron/cron.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from './core/common/common.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RolesGuard } from './core/guards/roles.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { WalletEntity } from './wallet/wallet.entity';
import { WalletStatementEntity } from './wallet/wallet-statement.entity';
import { OrderEntity } from './order/order.entity';
import { InventoryEntity } from './store/inventory.entity';
import { FailedOrderEntity } from './failed-order/failed-order.entity';
import { OrderParamsModule } from './order-params/order-params.module';
import { OrderParamsEntity } from './order-params/order-params.entity';
import { OrderItemsEntity } from './order/order-items.entity';
import { PpdModule } from './ppd/ppd.module';
import { PpdEntity } from './ppd/ppd.entity';
import { ProductEntity } from './store/product.entity';
import { PpdDispatchEntity } from './ppd/ppd-dispatch.entity';
import { PpdPickersPackersSupervisorsEntity } from './ppd/ppd-pickers-packers-supervisors.entity';
import { StoreEntity } from './store/store.entity';
import { EventsModule } from './events/events.module';
import { AudienceEntity } from './user/audience.entity';
import { UserAudienceEntity } from './user/user-audience.entity';
import { WinnerEntity } from './events/winner.entity';
import { EventEntity } from './events/event.entity';
import { FranchiseOrderEntity } from './order/franchise-order.entity';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { SuggestionEntity } from './suggestions/suggestions.entity';
import { FranchiseOrderItemEntity } from './order/franchise-order-item.entity';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { CommonService } from './core/common/common.service';
import { EventParamsEntity } from './events/event-params.entity';
import { MmDeliveryModule } from './middleMileDelivery/mmDelivery.module';
import { MmRoutingTableEntity } from './middleMileDelivery/mmRoutingTable.entity';
import { MmRoutesDistanceEntity } from './middleMileDelivery/mmRoutesDistance.entity';
import { MmDeliveryEntity } from './middleMileDelivery/mmDelivery.entity';
import { DmModule } from './data-migration/dm.module';
import { MigrationLogsPgEntity } from './data-migration/migration-logs.pg.entity';
import { WarehouseSkuEntity } from './data-migration/whskus.wh.entity';
import { WarehouseSkuPostgresEntity } from './data-migration/whskus.pg.entity';
import { StoresecondarypickingPgEntity } from './data-migration/storesecondarypicking.pg.entity';
import { StoresecondarypickingWhEntity } from './data-migration/storesecondarypicking.wh.entity';
import { MigrationLogsWhEntity } from './data-migration/migration-logs.wh.entity';
import { PgsqlL3TicketItemEntity } from './data-migration/pgsql-l3-ticket-item.wh.entity';
import { TicketEntity } from './data-migration/tickets.pg.entity';
import { AsyncContextModule } from '@nestjs-steroids/async-context';
import { PrivilegeEndpointsEntity } from './privilege/entity/privilege-endpoints.entity';
import { PrivilegeService } from './privilege/privilege.service';
import { PrivilegeHandlerInterceptor } from './core/privilege.interceptor';
import { LoggingMiddleware } from './core/logging.middleware';
import { SrSkusPgEntity } from './data-migration/sr-skus.pg.entity';
import { StoreRequisitionsWhEntity } from './data-migration/store-requisitions.wh.entity';
import { DarkStoreRequisitionsWhEntity } from "./data-migration/dark-store-requisitions.wh.entity";
import { DarkStoreRequisitionsPgEntity } from "./data-migration/dsr.pg.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: 5432,
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: 'postgres',
        entities: [
          WalletEntity,
          WalletStatementEntity,
          OrderEntity,
          InventoryEntity,
          FailedOrderEntity,
          OrderParamsEntity,
          OrderItemsEntity,
          ProductEntity,
          StoreEntity,
          AudienceEntity,
          UserAudienceEntity,
          WinnerEntity,
          EventEntity,
          FranchiseOrderEntity,
          FranchiseOrderItemEntity,
          SuggestionEntity,
          EventParamsEntity,
          MigrationLogsPgEntity,
          WarehouseSkuPostgresEntity,
          StoresecondarypickingPgEntity,
          TicketEntity,
          PrivilegeEndpointsEntity,
          SrSkusPgEntity,
          DarkStoreRequisitionsPgEntity
        ],
        namingStrategy: new SnakeNamingStrategy(),
        logging: false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      name: 'warehouseDB',
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        database: configService.get('WAREHOUSE_DATABASE'),
        host: configService.get('WAREHOUSE_DATABASE_HOST'),
        port: configService.get('WAREHOUSE_DATABASE_PORT'),
        username: configService.get('WAREHOUSE_DATABASE_USERNAME'),
        password: configService.get('WAREHOUSE_DATABASE_PASSWORD'),
        entities: [
          PpdEntity,
          MmRoutingTableEntity,
          PpdDispatchEntity,
          PpdPickersPackersSupervisorsEntity,
          MmRoutesDistanceEntity,
          MmDeliveryEntity,
          WarehouseSkuEntity,
          StoresecondarypickingWhEntity,
          MigrationLogsWhEntity,
          PgsqlL3TicketItemEntity,
          StoreRequisitionsWhEntity,
          DarkStoreRequisitionsWhEntity
        ],
        logging: false,
      }),
      inject: [ConfigService],
    }),
    CronModule,
    CommonModule,
    OrderParamsModule,
    PpdModule,
    StoreModule,
    EventsModule,
    SuggestionsModule,
    MmDeliveryModule,
    TypeOrmModule.forFeature([SuggestionEntity, PrivilegeEndpointsEntity]),
    DmModule,
    AsyncContextModule.forRoot(),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    CommonService,
    LoggingMiddleware,
    PrivilegeService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PrivilegeHandlerInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
