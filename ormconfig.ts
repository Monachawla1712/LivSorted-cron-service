import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { OrderEntity } from './src/order/order.entity';
import { WalletEntity } from './src/wallet/wallet.entity';
import { FailedOrderEntity } from './src/failed-order/failed-order.entity';
import { InventoryEntity } from './src/store/inventory.entity';
import { WalletStatementEntity } from './src/wallet/wallet-statement.entity';
import { OrderItemsEntity } from './src/order/order-items.entity';
import { PpdEntity } from 'src/ppd/ppd.entity';
import { ProductEntity } from './src/store/product.entity';
import { StoreEntity } from './src/store/store.entity';
import { AudienceEntity } from './src/user/audience.entity';
import { UserAudienceEntity } from './src/user/user-audience.entity';
import { WinnerEntity } from './src/events/winner.entity';
import { EventEntity } from './src/events/event.entity';
import { FranchiseOrderEntity } from './src/order/franchise-order.entity';
import { SuggestionEntity } from './src/suggestions/suggestions.entity';
import { FranchiseOrderItemEntity } from './src/order/franchise-order-item.entity';
import { EventParamsEntity } from './src/events/event-params.entity';
import { MmRoutingTableEntity } from './src/middleMileDelivery/mmRoutingTable.entity';
import { PpdDispatchEntity } from './src/ppd/ppd-dispatch.entity';
import { PpdPickersPackersSupervisorsEntity } from './src/ppd/ppd-pickers-packers-supervisors.entity';
import { MigrationLogsPgEntity } from './src/data-migration/migration-logs.pg.entity';
import { WarehouseSkuEntity } from './src/data-migration/whskus.wh.entity';
import { WarehouseSkuPostgresEntity } from './src/data-migration/whskus.pg.entity';
import { StoresecondarypickingPgEntity } from './src/data-migration/storesecondarypicking.pg.entity';
import { StoresecondarypickingWhEntity } from './src/data-migration/storesecondarypicking.wh.entity';
import { MigrationLogsWhEntity } from './src/data-migration/migration-logs.wh.entity';
import { PgsqlL3TicketItemEntity } from './src/data-migration/pgsql-l3-ticket-item.wh.entity';
import { TicketEntity } from './src/data-migration/tickets.pg.entity';
import { RolesEntity } from './src/privilege/entity/roles.entity';
import { RolePrivilegesEntity } from './src/privilege/entity/role-privileges.entity';
import { PrivilegeEndpointsEntity } from './src/privilege/entity/privilege-endpoints.entity';
import { SrSkusPgEntity } from './src/data-migration/sr-skus.pg.entity';
import { StoreRequisitionsWhEntity } from './src/data-migration/store-requisitions.wh.entity';
import { DarkStoreRequisitionsWhEntity } from "./src/data-migration/dark-store-requisitions.wh.entity";
import { DarkStoreRequisitionsPgEntity } from "./src/data-migration/dsr.pg.entity";

config();

const configService = new ConfigService();

export = [
  {
    type: 'postgres',
    url: configService.get('DATABASE_URL'),
    entities: [
      OrderEntity,
      WalletEntity,
      FailedOrderEntity,
      InventoryEntity,
      WalletStatementEntity,
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
      RolesEntity,
      RolePrivilegesEntity,
      PrivilegeEndpointsEntity,
      SrSkusPgEntity,
      DarkStoreRequisitionsPgEntity
    ],
  },
  {
    name: 'warehouseDB',
    type: 'mysql',
    url: configService.get('WAREHOUSE_DATABASE_URL'),
    entities: [
      PpdEntity,
      PpdDispatchEntity,
      PpdPickersPackersSupervisorsEntity,
      MmRoutingTableEntity,
      WarehouseSkuEntity,
      StoresecondarypickingWhEntity,
      MigrationLogsWhEntity,
      PgsqlL3TicketItemEntity,
      StoreRequisitionsWhEntity,
      DarkStoreRequisitionsWhEntity,
    ],
  },
];
