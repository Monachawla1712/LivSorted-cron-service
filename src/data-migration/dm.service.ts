import { Injectable } from '@nestjs/common';
import { Between, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { WarehouseSkuEntity } from './whskus.wh.entity';
import { WarehouseSkuPostgresEntity } from './whskus.pg.entity';
import { MigrationLogsPgEntity } from './migration-logs.pg.entity';
import {
  PG_L3_TICKET_ITEM_TABLE_NAME,
  SR_SKUS_TABLE_NAME,
  SSP_TABLE_NAME,
  DSR_INFO_TABLE_NAME,
  WHSKUS_TABLE_NAME,
  WAREHOUSE_SCHEMA_NAME,
} from './dm.constants';
import { StoresecondarypickingWhEntity } from './storesecondarypicking.wh.entity';
import { StoresecondarypickingPgEntity } from './storesecondarypicking.pg.entity';
import { TicketEntity } from './tickets.pg.entity';
import { MigrationLogsWhEntity } from './migration-logs.wh.entity';
import {
  PgsqlL3TicketItemEntity,
  TicketsL3PgQueryResult,
} from './pgsql-l3-ticket-item.wh.entity';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { StoreRequisitionsWhEntity } from './store-requisitions.wh.entity';
import { SrSkusPgEntity, SrSkusWhQueryResult } from './sr-skus.pg.entity';
import { DarkStoreRequisitionsWhEntity } from './dark-store-requisitions.wh.entity';
import {
  DarkStoreRequisitionsPgEntity,
  DsrInfoQueryResult,
} from './dsr.pg.entity';

interface Transformer<T, U> {
  (source: T): U;
}

@Injectable()
export class DmService {
  private readonly logger = new CustomLogger(DmService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private configService: ConfigService,
    @InjectRepository(MigrationLogsPgEntity)
    private readonly migrationLogsRepository: Repository<MigrationLogsPgEntity>,
    @InjectRepository(WarehouseSkuPostgresEntity)
    private readonly whSkuPostgresRepository: Repository<WarehouseSkuPostgresEntity>,
    @InjectRepository(StoresecondarypickingPgEntity)
    private readonly sspPostgresRepository: Repository<StoresecondarypickingPgEntity>,
    @InjectRepository(WarehouseSkuEntity, 'warehouseDB')
    private readonly whSkuRepository: Repository<WarehouseSkuEntity>,
    @InjectRepository(StoresecondarypickingWhEntity, 'warehouseDB')
    private readonly sspRepository: Repository<StoresecondarypickingWhEntity>,
    @InjectRepository(TicketEntity)
    private readonly ticketRepository: Repository<TicketEntity>,
    @InjectRepository(PgsqlL3TicketItemEntity, 'warehouseDB')
    private readonly pgsqlL3TicketItemRepository: Repository<PgsqlL3TicketItemEntity>,
    @InjectRepository(MigrationLogsWhEntity, 'warehouseDB')
    private readonly migrationLogsWhRepository: Repository<MigrationLogsWhEntity>,
    @InjectRepository(StoreRequisitionsWhEntity, 'warehouseDB')
    private readonly storeRequisitionsWhEntityRepository: Repository<StoreRequisitionsWhEntity>,
    @InjectRepository(SrSkusPgEntity)
    private readonly skusPgEntityRepository: Repository<SrSkusPgEntity>,
    @InjectRepository(DarkStoreRequisitionsWhEntity, 'warehouseDB')
    private readonly darkStoreRequisitionsWhEntityRepository: Repository<DarkStoreRequisitionsWhEntity>,
    @InjectRepository(DarkStoreRequisitionsPgEntity)
    private readonly darkStoreRequisitionsPgEntityRepository: Repository<DarkStoreRequisitionsPgEntity>,
  ) {}

  async migrateEntityToEntityData<
    sourceEntity extends { modified_on: Date },
    targetEntity,
  >(
    sourceRepository: Repository<sourceEntity>,
    targetRepository: Repository<targetEntity>,
    filter: {
      lastModifiedFrom?: Date;
      lastModifiedTo?: Date;
    },
    transform: Transformer<sourceEntity, targetEntity>,
    batchSize = 1000,
  ): Promise<{ syncedTill: Date; rowsAffected: number }> {
    let page = 1;
    let syncedTill: Date = null,
      rowsAffected = 0;

    const whereClause: any = {};
    const orderClause: any = {};
    if (filter.lastModifiedFrom && filter.lastModifiedTo) {
      filter.lastModifiedFrom.setMilliseconds(
        filter.lastModifiedFrom.getMilliseconds() + 1,
      );
      whereClause.modified_on = Between(
        filter.lastModifiedFrom,
        filter.lastModifiedTo,
      );
      orderClause.modified_on = 'ASC';
    } else if (filter.lastModifiedTo) {
      whereClause.modified_on = LessThanOrEqual(filter.lastModifiedTo);
      orderClause.modified_on = 'ASC';
    } else if (filter.lastModifiedFrom) {
      whereClause.modified_on = MoreThan(filter.lastModifiedFrom);
      orderClause.modified_on = 'ASC';
    }

    try {
      let rows = 0;
      do {
        const dataToMigrate: sourceEntity[] = await sourceRepository.find({
          take: batchSize,
          skip: (page - 1) * batchSize,
          where: { ...whereClause },
          order: { ...orderClause },
        });
        rows = dataToMigrate.length;
        if (rows > 0) {
          const transformedData: targetEntity[] = dataToMigrate.map((item) =>
            transform(item),
          );
          await targetRepository.save(transformedData);
          syncedTill = dataToMigrate.reduce(
            (max, obj) => (obj.modified_on > max ? obj.modified_on : max),
            dataToMigrate[0].modified_on,
          );
          page++;
          rowsAffected += rows;
        }
      } while (rows === batchSize);
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong',
        e,
      );
    }
    return { syncedTill, rowsAffected };
  }

  private async clearTableForDate<sourceEntity>(
    date: Date,
    repository: Repository<sourceEntity>,
    tableName: string,
    schema: string,
  ) {
    const dateString = date.toISOString().split('T')[0];
    const query = `
      DELETE FROM "${schema}"."${tableName}"
      WHERE date = $1
    `;
    await repository.query(query, [dateString]);
  }

  async getLastPgMigratedTime(tableName: string): Promise<Date> {
    const last_migration_log: MigrationLogsPgEntity = (
      await this.migrationLogsRepository
        .createQueryBuilder()
        .update({ is_latest: false })
        .where({
          table_name: tableName,
          is_latest: true,
        })
        .returning('*')
        .execute()
    ).raw[0];
    return last_migration_log != null ? last_migration_log.synced_till : null;
  }

  async savePgMigrationLog(
    tableName: string,
    syncedTill: Date,
    rowsAffected: number,
  ): Promise<void> {
    if (syncedTill != null) {
      await this.migrationLogsRepository.save({
        table_name: tableName,
        synced_till: syncedTill,
        is_latest: true,
        rows_affected: rowsAffected,
        created_on: new Date(),
      });
    }
  }

  async migrateQueryToEntityData<sourceEntity, targetEntity, extractResult>(
    resultsExtractor: (
      sourceRepository: Repository<sourceEntity>,
      createdOnFrom: Date,
      createdOnTo: Date,
      limit: number,
      offset: number,
      sort: string,
    ) => Promise<extractResult[]>,
    sourceRepository: Repository<sourceEntity>,
    targetRepository: Repository<targetEntity>,
    filter: {
      lastModifiedFrom?: Date;
      lastModifiedTo?: Date;
    },
    transform: Transformer<extractResult, targetEntity>,
    batchSize = 1000,
    syncColumnName: string,
  ): Promise<{ syncedTill: Date; rowsAffected: number }> {
    let page = 1;
    let syncedTill: Date = null,
      rowsAffected = 0;

    try {
      let rows = 0;
      do {
        const dataToMigrate: extractResult[] = await resultsExtractor(
          sourceRepository,
          filter.lastModifiedFrom,
          filter.lastModifiedTo,
          batchSize,
          (page - 1) * batchSize,
          'ASC',
        );
        rows = dataToMigrate.length;
        if (rows > 0) {
          const transformedData: targetEntity[] = dataToMigrate.map((item) =>
            transform(item),
          );
          await targetRepository.save(transformedData);
          syncedTill = dataToMigrate.reduce(
            (max, obj) =>
              obj[syncColumnName] > max ? obj[syncColumnName] : max,
            dataToMigrate[0][syncColumnName],
          );
          page++;
          rowsAffected += rows;
        }
      } while (rows === batchSize);
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong',
        e,
      );
    }
    return { syncedTill, rowsAffected };
  }

  private async getLastWhMigratedTime(tableName: string) {
    const last_migration_log = await this.migrationLogsWhRepository.findOne({
      where: { table_name: tableName, is_latest: 1 },
    });
    if (last_migration_log != null) {
      last_migration_log.is_latest = 0;
      await this.migrationLogsWhRepository.save(last_migration_log);
    }
    return last_migration_log != null ? last_migration_log.synced_till : null;
  }

  private async saveWhMigrationLog(
    tableName: string,
    syncedTill: Date,
    rowsAffected: number,
  ) {
    if (syncedTill != null) {
      await this.migrationLogsWhRepository.save({
        table_name: tableName,
        synced_till: syncedTill,
        is_latest: 1,
        rows_affected: rowsAffected,
        created_on: new Date(),
      });
    }
  }

  async migrateWhSkus() {
    const transform: Transformer<
      WarehouseSkuEntity,
      WarehouseSkuPostgresEntity
    > = (source: WarehouseSkuEntity) => {
      const target = new WarehouseSkuPostgresEntity();
      Object.assign(target, source);
      return target;
    };

    const lastSyncedTill = await this.getLastPgMigratedTime(WHSKUS_TABLE_NAME);

    const { syncedTill: currentSyncedTill, rowsAffected: rowsAffected } =
      await this.migrateEntityToEntityData(
        this.whSkuRepository,
        this.whSkuPostgresRepository,
        {
          lastModifiedFrom: lastSyncedTill,
          lastModifiedTo: new Date(),
        },
        transform,
        1000,
      );

    await this.savePgMigrationLog(
      WHSKUS_TABLE_NAME,
      currentSyncedTill != null ? currentSyncedTill : lastSyncedTill,
      rowsAffected,
    );
  }

  async migrateStoreSecondaryPicking() {
    const transform: Transformer<
      StoresecondarypickingWhEntity,
      StoresecondarypickingPgEntity
    > = (source: StoresecondarypickingWhEntity) => {
      const target = new StoresecondarypickingPgEntity();
      Object.assign(target, source);
      return target;
    };

    const lastSyncedTill = await this.getLastPgMigratedTime(SSP_TABLE_NAME);

    const { syncedTill: currentSyncedTill, rowsAffected: rowsAffected } =
      await this.migrateEntityToEntityData(
        this.sspRepository,
        this.sspPostgresRepository,
        {
          lastModifiedFrom: lastSyncedTill,
          lastModifiedTo: new Date(),
        },
        transform,
        1000,
      );

    await this.savePgMigrationLog(
      SSP_TABLE_NAME,
      currentSyncedTill != null ? currentSyncedTill : lastSyncedTill,
      rowsAffected,
    );
  }

  async migrateTicketItemsL3ToWh() {
    const lastSyncedTill = await this.getLastWhMigratedTime(
        PG_L3_TICKET_ITEM_TABLE_NAME,
    );

    const extractL3TicketData = async (
        mainRepository: Repository<TicketEntity>,
        createdOnLL: Date,
        createdOnUL: Date,
        limit: number,
        offset: number,
        order: string,
    ) => {
      let query =
          'select t.id as ticket_id, \n' +
          'ti.id as ticket_item_id, \n' +
          't.requester_entity_id as customer_id, \n' +
          "t.metadata->'consumerOrderDetails'->>'orderId' as order_id, \n" +
          "ti.details->'consumerOrderDetails'->>'skuCode' as sku_code, \n" +
          "ti.details->'consumerOrderDetails'->>'issueQty' as issue_qty, \n" +
          'tc."label" as l3_category_label, \n' +
          'ti.created_at as ticket_creation_time \n' +
          'from ticket.tickets t \n' +
          'join ticket.ticket_items ti \n' +
          'on t.id = ti.ticket_id \n' +
          'join ticket.ticket_categories tc \n' +
          'on ti.category_leaf_id = tc.id\n' +
          'where category_root_id = 111 \n' +
          'and t.active = 1 \n' +
          'and ti.active = 1 \n' +
          'and tc.active = 1\n' +
          'and ti.details is not null\n' +
          "and ti.details->>'consumerOrderDetails' is not null \n" +
          "and ti.details->'consumerOrderDetails'->>'skuCode' is not null \n" +
          'and t.metadata is not null\n' +
          "and t.metadata->'consumerOrderDetails' is not null \n" +
          "and t.metadata->'consumerOrderDetails'->>'orderId' is not null \n" +
          "and t.requester_entity_type = 'USER' \n" +
          "and ti.status != 'CANCELLED'\n";
      const qa = [];
      if (createdOnLL != null) {
        qa.push(createdOnLL);
        const paramNum = qa.length;
        query += `and ti.created_at >= $${paramNum}\n`;
      }
      if (createdOnUL != null) {
        qa.push(createdOnUL);
        const paramNum = qa.length;
        query += `and ti.created_at <= $${paramNum}\n`;
      }
      if (order != null) {
        query += `order by ti.created_at ${order}\n`;
      }
      if (limit != null) {
        qa.push(limit);
        const paramNum = qa.length;
        query += `limit $${paramNum}\n`;
      }
      if (offset != null) {
        qa.push(offset);
        const paramNum = qa.length;
        query += `offset $${paramNum}\n`;
      }
      return await mainRepository.query(query, qa);
    };

    const transform: Transformer<
        TicketsL3PgQueryResult,
        PgsqlL3TicketItemEntity
    > = (source: TicketsL3PgQueryResult) => {
      const target = new PgsqlL3TicketItemEntity();
      Object.assign(target, source);
      return target;
    };

    const { syncedTill: currentSyncedTill, rowsAffected: rowsAffected } =
        await this.migrateQueryToEntityData(
            extractL3TicketData,
            this.ticketRepository,
            this.pgsqlL3TicketItemRepository,
            {
              lastModifiedFrom: lastSyncedTill,
              lastModifiedTo: new Date(),
            },
            transform,
            1000,
            'ticket_creation_time',
        );

    await this.saveWhMigrationLog(
        PG_L3_TICKET_ITEM_TABLE_NAME,
        currentSyncedTill != null ? currentSyncedTill : lastSyncedTill,
        rowsAffected,
    );
  }

  async migrateDsrInfoToPg(date: Date) {
    const lastSyncedTill = await this.getLastPgMigratedTime(
      DSR_INFO_TABLE_NAME,
    );

    const extractWhSkusInfoData = async (mainRepository) => {
      if (date) {
        await this.clearTableForDate(
          date,
          this.darkStoreRequisitionsPgEntityRepository,
          DSR_INFO_TABLE_NAME,
          WAREHOUSE_SCHEMA_NAME,
        );
      }
      let query = `
      SELECT
        dsr.id as dsr_id,
        dsr.store_id,
        dsr.wh_id,
        dsr.date,
        dsr.sku_code,
        dsr.grade,
        COALESCE(dsr.dispatched_qty, 0) AS dispatched_qty,
        COALESCE(ABS(SUM(dsrl.updated_qty)), 0) AS rejection,
        CONCAT(u.firstname, ' ', u.lastname) AS packer_name,
        u.phone
      FROM
        dark_store_requisitions dsr
          LEFT JOIN
        dark_store_inventory_logs AS dsrl
        ON dsr.sku_code = dsrl.sku_code
          AND dsr.grade = dsrl.grade
          AND dsr.store_id = dsrl.store_id
          AND DATE(dsrl.created_on) = DATE(dsr.created_on) 
        AND dsrl.update_type = 7
        LEFT JOIN
         (SELECT dsr_id, created_by
        FROM dsr_picking_logs) dpl ON dsr.id = dpl.dsr_id
        LEFT JOIN
        admin_users AS u ON
        dpl.created_by = u.id
    `;
      const queryParams: any[] = [];
      if (date) {
        query += `WHERE dsr.date = ? `;
        queryParams.push(date.toISOString().split('T')[0]);
      } else {
        query += `WHERE dsr.date = CURRENT_DATE `;
      }
      query += `
    GROUP BY
      dsr.id,
      dsr.store_id,
      dsr.wh_id,
      dsr.date,
      dsr.sku_code,
      dsr.grade,
      dsr.dispatched_qty,
      u.firstname,
      u.lastname,
      u.phone`;
      return await mainRepository.query(query, queryParams);
    };

    const transform: Transformer<
      DsrInfoQueryResult,
      DarkStoreRequisitionsPgEntity
    > = (source: DsrInfoQueryResult) => {
      const target = new DarkStoreRequisitionsPgEntity();
      Object.assign(target, source);
      return target;
    };

    const { syncedTill: currentSyncedTill, rowsAffected: rowsAffected } =
      await this.migrateQueryToEntityData(
        extractWhSkusInfoData,
        this.darkStoreRequisitionsWhEntityRepository,
        this.darkStoreRequisitionsPgEntityRepository,
        {
          lastModifiedFrom: lastSyncedTill,
          lastModifiedTo: new Date(),
        },
        transform,
        4000,
        'date',
      );

    await this.savePgMigrationLog(
      DSR_INFO_TABLE_NAME,
      currentSyncedTill != null ? currentSyncedTill : lastSyncedTill,
      rowsAffected,
    );
  }

  async migrateSrSkusDataToPg() {
    const lastSyncedTill = await this.getLastPgMigratedTime(SR_SKUS_TABLE_NAME);

    const extractSrSkusData = async (
      mainRepository: Repository<StoreRequisitionsWhEntity>,
      modifiedOnLL: Date,
      modifiedOnUL: Date,
      limit: number,
      offset: number,
      order: string,
    ) => {
      let query =
        'Select srs.id as srs_id, sr.id as sr_id, sr.wh_id, sr.store_id, ' +
        'sr.order_id, srs.sku_code, sr.date, sr.slot, sr.type,' +
        'sr.status  as sr_status, srs.status as srs_status, srs.jit_picked, ' +
        'srs.is_bulk, sr.active  as sr_active,  srs.active as srs_active, ' +
        'GREATEST(sr.modified_on, srs.modified_on) as modified_on ' +
        'from store_requisitions sr join store_requisition_skus srs on ' +
        'sr.id = srs.store_requisition_id WHERE 1=1 ';
      const qa = [];
      if (modifiedOnLL !== null) {
        qa.push(modifiedOnLL);
        query += `and GREATEST(sr.modified_on, srs.modified_on) >= ? `;
      }
      if (modifiedOnUL !== null) {
        qa.push(modifiedOnUL);
        query += `and GREATEST(sr.modified_on, srs.modified_on) <= ? `;
      }
      if (order != null) {
        query += `order by GREATEST(sr.modified_on, srs.modified_on) ${order} `;
      }
      if (limit !== null) {
        qa.push(limit);
        query += `limit ? `;
      }
      if (offset !== null) {
        qa.push(offset);
        query += `offset ? `;
      }
      return await mainRepository.query(query, qa);
    };

    const transform: Transformer<SrSkusWhQueryResult, SrSkusPgEntity> = (
      source: SrSkusWhQueryResult,
    ) => {
      const target = new SrSkusPgEntity();
      Object.assign(target, source);
      return target;
    };

    const { syncedTill: currentSyncedTill, rowsAffected: rowsAffected } =
      await this.migrateQueryToEntityData(
        extractSrSkusData,
        this.storeRequisitionsWhEntityRepository,
        this.skusPgEntityRepository,
        {
          lastModifiedFrom: lastSyncedTill,
          lastModifiedTo: new Date(),
        },
        transform,
        4000,
        'modified_on',
      );

    await this.savePgMigrationLog(
      SR_SKUS_TABLE_NAME,
      currentSyncedTill != null ? currentSyncedTill : lastSyncedTill,
      rowsAffected,
    );
  }

}
