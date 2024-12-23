import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DmController } from './dm.controller';
import { DmService } from './dm.service';
import { WarehouseSkuEntity } from './whskus.wh.entity';
import { WarehouseSkuPostgresEntity } from './whskus.pg.entity';
import { MigrationLogsPgEntity } from './migration-logs.pg.entity';
import { StoresecondarypickingWhEntity } from './storesecondarypicking.wh.entity';
import { StoresecondarypickingPgEntity } from './storesecondarypicking.pg.entity';
import { TicketEntity } from './tickets.pg.entity';
import { MigrationLogsWhEntity } from './migration-logs.wh.entity';
import { PgsqlL3TicketItemEntity } from './pgsql-l3-ticket-item.wh.entity';
import { StoreRequisitionsWhEntity } from './store-requisitions.wh.entity';
import { SrSkusPgEntity } from './sr-skus.pg.entity';
import {DarkStoreRequisitionsWhEntity} from "./dark-store-requisitions.wh.entity";
import {DarkStoreRequisitionsPgEntity} from "./dsr.pg.entity";

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      MigrationLogsPgEntity,
      WarehouseSkuPostgresEntity,
      StoresecondarypickingPgEntity,
      TicketEntity,
      SrSkusPgEntity,
        DarkStoreRequisitionsPgEntity
    ]),
    TypeOrmModule.forFeature(
      [
        WarehouseSkuEntity,
        StoresecondarypickingWhEntity,
        MigrationLogsWhEntity,
        PgsqlL3TicketItemEntity,
        StoreRequisitionsWhEntity,
          DarkStoreRequisitionsWhEntity
      ],
      'warehouseDB',
    ),
  ],
  providers: [DmService, ConfigService],
  controllers: [DmController],
})
export class DmModule {}
