import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import {
  PGSQL_MIGRATION_LOGS_TABLE_NAME,
  WAREHOUSE_SCHEMA_NAME,
} from './dm.constants';

@Entity({
  name: PGSQL_MIGRATION_LOGS_TABLE_NAME,
  schema: WAREHOUSE_SCHEMA_NAME,
})
export class MigrationLogsWhEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  table_name: string;

  @Column()
  synced_till: Date;

  @Column()
  is_latest: number;

  @Column()
  rows_affected: number;

  @Column()
  created_on: Date;
}
