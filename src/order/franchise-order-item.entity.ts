import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FranchiseOrderEntity } from './franchise-order.entity';

@Entity({ name: 'franchise_order_items', schema: 'oms_trans_' })
export class FranchiseOrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'sku_code' })
  skuCode: string;

  @Column({
    name: 'wh_id',
    type: 'numeric',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  whId: number;

  @Column({ name: 'product_name' })
  productName: string;

  @Column({ name: 'image_url' })
  imageUrl: string;

  @Column({ name: 'category_name' })
  categoryName: string;

  @Column({
    name: 'ordered_qty',
    type: 'numeric',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  orderedQty: number;

  @Column({ name: 'sale_price', type: 'numeric', precision: 10, scale: 2 })
  salePrice: number;

  @Column({
    name: 'marked_price',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  markedPrice: number;

  @Column({
    name: 'refund_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  refundAmount: number;

  @Column({ name: 'is_refundable', type: 'smallint' })
  isRefundable: number;

  @Column({ name: 'is_returnable', type: 'smallint' })
  isReturnable: number;

  @Column({ type: 'smallint', default: 0 })
  status: number;

  @Column({ type: 'smallint' })
  active: number;

  @Column({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'modified_at' })
  modifiedAt: Date;

  @Column({ name: 'modified_by' })
  modifiedBy: string;

  @Column({
    name: 'final_quantity',
    type: 'numeric',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  finalQuantity: number;

  @Column({
    name: 'moq',
    type: 'numeric',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  moq: number;

  @Column({
    name: 'mrp_gross_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  mrpGrossAmount: number;

  @Column({
    name: 'sp_gross_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  spGrossAmount: number;

  @Column({
    name: 'discount_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discountAmount: number;

  @Column({
    name: 'tax_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  taxAmount: number;

  @Column({
    name: 'final_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  finalAmount: number;

  @Column({ name: 'ordered_crate_qty', type: 'integer' })
  orderedCrateQty: number;

  @Column({ name: 'final_crate_qty', type: 'integer' })
  finalCrateQty: number;

  @Column({ name: 'crates_picked', type: 'integer', nullable: true })
  cratesPicked: number;

  @Column({
    name: 'weight_picked',
    type: 'numeric',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  weightPicked: number;

  @Column({ name: 'uom', nullable: true })
  uom: string;

  @Column({
    name: 'margin_discount_percent',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  marginDiscountPercent: number;

  @Column({
    name: 'prorata_amount',
    type: 'numeric',
    precision: 10,
    scale: 3,
    default: 0,
  })
  prorataAmount: number;

  @Column({ name: 'hsn', nullable: true })
  hsn: string;

  @Column({ name: 'refund_details', type: 'jsonb', nullable: true })
  refundDetails: object;

  @ManyToOne(() => FranchiseOrderEntity, (order) => order.franchiseOrderItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  franchiseOrder: FranchiseOrderEntity;
}
