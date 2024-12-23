import { Entity, Column, PrimaryColumn } from 'typeorm';
import { SR_SKUS_TABLE_NAME, WAREHOUSE_SCHEMA_NAME } from './dm.constants';

export class SrSkusWhQueryResult {
  srs_id: number;
  sr_id: number;
  wh_id: number;
  store_id: number;
  order_id: string;
  sku_code: string;
  date: Date;
  slot: string;
  type: number;
  sr_status: number;
  srs_status: number;
  jit_picked: number;
  is_bulk: number;
  sr_active: number;
  srs_active: number;
  modified_on: Date;
}

@Entity({ name: SR_SKUS_TABLE_NAME, schema: WAREHOUSE_SCHEMA_NAME })
export class SrSkusPgEntity {
  @PrimaryColumn()
  srs_id: number;

  @Column()
  sr_id: number;

  @Column()
  wh_id: number;

  @Column()
  store_id: number;

  @Column()
  order_id: string;

  @Column()
  sku_code: string;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  slot: string;

  @Column()
  type: number;

  @Column()
  sr_status: number;

  @Column()
  srs_status: number;

  @Column()
  jit_picked: number;

  @Column()
  is_bulk: number;

  @Column()
  sr_active: number;

  @Column()
  srs_active: number;

  @Column({ type: 'timestamp with time zone' })
  modified_on: Date;
}
