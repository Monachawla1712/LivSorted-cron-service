import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../core/common/common.entity';
import { PaymentDetailObject } from './classes/payment-detail-object';
import { MetadataObject } from './classes/metadata-object';
import { OfferData } from './classes/offer-data';

@Entity({ name: 'orders', schema: 'oms_trans_' })
export class OrderEntity extends CommonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  display_order_id: string;

  @Column()
  customer_id: string;

  @Column()
  store_id: string;

  @Column()
  store_device_id: string;

  @Column()
  total_mrp_gross_amount: string;

  @Column()
  total_sp_gross_amount: string;

  @Column()
  total_discount_amount: string;

  @Column()
  total_tax_amount: string;

  @Column()
  total_extra_fee_amount: string;

  @Column()
  refund_amount: string;

  @Column({ type: 'numeric' })
  final_bill_amount: string;

  @Column()
  amount_received: string;

  @Column('jsonb')
  tax_details: object;

  @Column('jsonb')
  total_additional_discount: object;

  @Column('jsonb')
  extra_fee_details: object;

  @Column()
  item_count: number;

  @Column()
  channel: string;

  @Column()
  shipping_method: number;

  @Column()
  payment_method: string;

  @Column()
  status: number;

  @Column()
  delivery_address: number;

  @Column()
  notes: string;

  @Column()
  is_refunded: number;

  @Column('jsonb')
  metadata: MetadataObject;

  @Column()
  estimated_bill_amount: string;

  @Column('jsonb')
  offer_data: OfferData;

  @Column()
  submitted_at: Date;

  @Column()
  lithos_order_id: number;

  @Column()
  app_request_time: Date;

  @Column('jsonb')
  payment_detail: PaymentDetailObject;

  @Column()
  lithos_synced: number;

  @Column({ type: 'date' })
  delivery_date: Date;
}
