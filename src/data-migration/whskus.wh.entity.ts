import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { WHSKUS_TABLE_NAME } from './dm.constants';

@Entity({ name: WHSKUS_TABLE_NAME })
export class WarehouseSkuEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  wh_id: number;

  @Column()
  sku_code: string;

  @Column()
  moq: number;

  @Column()
  sale_price: number;

  @Column()
  sorted_retail_price: number;

  @Column()
  quantity: number;

  @Column()
  actual_qty: number;

  @Column()
  max_order_qty: number;

  @Column()
  margin_discount: number;

  @Column()
  app_active: number;

  @Column()
  doh: number;

  @Column()
  permissible_refund_quantity: number;

  @Column()
  active: number;

  @Column()
  created_on: Date;

  @Column()
  modified_on: Date;

  @Column()
  created_by: string;

  @Column()
  modified_by: string;
}