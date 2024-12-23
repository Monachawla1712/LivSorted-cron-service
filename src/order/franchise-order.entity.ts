import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { FranchiseOrderItemEntity } from './franchise-order-item.entity';
import { ColumnNumericTransformer } from '../core/common/transformers';

@Entity({ name: 'franchise_orders', schema: 'oms_trans_' })
export class FranchiseOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', nullable: true })
  customerId: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @Column({
    name: 'total_mrp_gross_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: new ColumnNumericTransformer(),
  })
  totalMrpGrossAmount: number;

  @Column({
    name: 'total_sp_gross_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: new ColumnNumericTransformer(),
  })
  totalSpGrossAmount: number;

  @Column({
    name: 'total_discount_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: new ColumnNumericTransformer(),
  })
  totalDiscountAmount: number;

  @Column({
    name: 'total_tax_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: new ColumnNumericTransformer(),
  })
  totalTaxAmount: number;

  @Column({
    name: 'total_extra_fee_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: new ColumnNumericTransformer(),
  })
  totalExtraFeeAmount: number;

  @Column({
    name: 'refund_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: new ColumnNumericTransformer(),
  })
  refundAmount: number;

  @Column({
    name: 'final_bill_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: new ColumnNumericTransformer(),
  })
  finalBillAmount: number;

  @Column({
    name: 'amount_received',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: new ColumnNumericTransformer(),
  })
  amountReceived: number;

  @Column({ name: 'item_count', default: 0 })
  itemCount: number;

  @Column({ default: 0 })
  status: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ name: 'is_refunded', nullable: true, default: 0 })
  isRefunded: number;

  @Column()
  active: number;

  @Column({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'modified_at' })
  modifiedAt: Date;

  @Column({ name: 'modified_by' })
  modifiedBy: string;

  @Column({ name: 'submitted_at', nullable: true })
  submittedAt: Date;

  @Column({ name: 'parent_order_id', nullable: true })
  parentOrderId: string;

  @Column({ name: 'is_refund_order', default: 0 })
  isRefundOrder: number;

  @Column({ name: 'display_order_id', nullable: true })
  displayOrderId: string;

  @Column({ name: 'delivery_date', type: 'date', nullable: true })
  deliveryDate: string;

  @Column({
    name: 'estimated_bill_amount',
    type: 'numeric',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  estimatedBillAmount: number;

  @Column({ name: 'is_sr_uploaded', nullable: true })
  isSrUploaded: number;

  @Column({ name: 'is_srp_store', default: 0 })
  isSrpStore: number;

  @Column({ name: 'slot', nullable: true })
  slot: string;

  @Column({ name: 'refund_type', nullable: true })
  refundType: string;

  @Column({ name: 'challan_url', nullable: true })
  challanUrl: string;

  @OneToMany(
    () => FranchiseOrderItemEntity,
    (orderItem) => orderItem.franchiseOrder,
    {
      cascade: true,
      eager: true,
    },
  )
  @JoinColumn({ name: 'order_id' })
  franchiseOrderItems: FranchiseOrderItemEntity[];
}
