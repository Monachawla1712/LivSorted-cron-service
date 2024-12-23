import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import {
  MYSQL_MIGRATION_LOGS_TABLE_NAME,
  WAREHOUSE_SCHEMA_NAME,
} from './dm.constants';

@Entity({
  name: MYSQL_MIGRATION_LOGS_TABLE_NAME,
  schema: WAREHOUSE_SCHEMA_NAME,
})
export class MigrationLogsPgEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  table_name: string;

  @Column()
  synced_till: Date;

  @Column()
  is_latest: boolean;

  @Column()
  rows_affected: number;

  @Column()
  created_on: Date;
}
