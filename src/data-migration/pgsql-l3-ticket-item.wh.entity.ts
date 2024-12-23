import { Entity, Column, PrimaryColumn } from 'typeorm';
import { PG_L3_TICKET_ITEM_TABLE_NAME } from './dm.constants';

export class TicketsL3PgQueryResult {
  ticket_id: number;
  ticket_item_id: number;
  store_id: number;
  issue_qty: number;
  customer_id: string;
  order_id: string;
  sku_code: string;
  l3_category_label: string;
  ticket_creation_time: Date;
}

@Entity({ name: PG_L3_TICKET_ITEM_TABLE_NAME })
export class PgsqlL3TicketItemEntity {
  @PrimaryColumn()
  ticket_item_id: number;

  @Column()
  ticket_id: number;

  @Column({ nullable: true })
  store_id: number;

  @Column()
  customer_id: string;

  @Column({ nullable: true })
  order_id: string;

  @Column()
  sku_code: string;

  @Column()
  issue_qty: number;

  @Column()
  l3_category_label: string;

  @Column()
  ticket_creation_time: Date;
}