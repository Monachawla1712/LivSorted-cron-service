import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { WAREHOUSE_SCHEMA_NAME, DSR_INFO_TABLE_NAME } from './dm.constants';

export class DsrInfoQueryResult {
  dsr_id: number;
  wh_id: number;
  store_id: number;
  sku_code: string;
  date: Date;
  dispatched_qty: number;
  rejection: number;
  packer_name: string;
  phone: string;
  created_on: number;
}

@Entity({ name: DSR_INFO_TABLE_NAME, schema: WAREHOUSE_SCHEMA_NAME })
export class DarkStoreRequisitionsPgEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dsr_id: number;

  @Column()
  wh_id: number;

  @Column()
  store_id: number;

  @Column()
  sku_code: string;

  @Column()
  grade: string;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  dispatched_qty: number;

  @Column()
  rejection: number;

  @Column()
  packer_name: string;

  @Column()
  phone: string;
}
