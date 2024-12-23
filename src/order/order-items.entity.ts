import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../core/common/common.entity';

@Entity({ name: 'order_items', schema: 'oms_trans_' })
export class OrderItemsEntity extends CommonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  order_id?: string;

  @Column()
  sku_code?: string;

  @Column()
  product_name?: string;

  @Column()
  final_quantity?: string;

  @Column()
  image_url?: string;

  @Column()
  category_id?: number;

  @Column()
  category_name?: string;

  @Column()
  ordered_qty?: string;

  @Column()
  uom?: string;

  @Column()
  sale_price?: string;

  @Column()
  marked_price?: string;

  @Column()
  mrp_gross_amount?: string;

  @Column()
  discount_amount?: string;

  @Column('json')
  additional_discount?: object;

  @Column()
  tax_amount?: string;

  @Column('json')
  tax_details?: object;

  @Column('json')
  product_tags?: object;

  @Column()
  sp_gross_amount?: string;

  @Column('json')
  price_bracket?: object;

  @Column('jsonb')
  metadata?: object;

  @Column()
  refund_amount?: string;

  @Column()
  final_amount?: string;

  @Column()
  is_refundable?: number;

  @Column()
  is_returnable?: number;

  @Column()
  status?: number;
}
