import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import Any = jasmine.Any;
import { InventoryView } from './enum/inventory-view.enum';
import { StoreStatus } from './enum/store.status';

@Entity('stores', { schema: 'store' })
export class StoreEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('character varying', { name: 'store_id', unique: true })
  store_id: string;

  @Column('character varying', { name: 'name' })
  name: string;

  @Column('uuid', { name: 'owner_id' })
  ownerId: string;

  @Column('character varying', { name: 'owner_name' })
  ownerName: string;

  @Column('boolean', { name: 'is_active', default: () => 'false' })
  isActive: boolean;

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    name: 'location',
    srid: 4326,
    nullable: true,
    spatialFeatureType: 'Point',
  })
  location: string;

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    name: 'boundry',
    srid: 4326,
    nullable: true,
    spatialFeatureType: 'Polygon',
  })
  boundry: string;

  @Column('boolean', { name: 'is_bounded', default: false })
  isBounded: boolean;

  @Column('character varying', { name: 'address_line_1' })
  addressLine_1: string;

  @Column('character varying', { name: 'address_line_2', nullable: true })
  addressLine_2: string | null;

  @Column('character varying', { name: 'landmark', nullable: true })
  landmark: string | null;

  @Column('character varying', { name: 'city' })
  city: string;

  @Column('character varying', { name: 'state' })
  state: string;

  @Column('integer', { name: 'pincode' })
  pincode: number;

  @Column('boolean', { default: true })
  is_open: boolean;

  @Column('character varying', { name: 'contact_number', nullable: true })
  contactNumber: string | null;

  @Column('character varying', { name: 'upi_id', nullable: true })
  upiId: string | null;

  @Column('integer', { name: 'min_eta', nullable: true })
  min_eta: number;

  @Column('integer', { name: 'max_eta', nullable: true })
  max_eta: number;

  @Column({ nullable: true, default: null })
  lithos_ref: number;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @Column('character varying', {
    name: 'updated_by',
  })
  updatedBy: string;

  @Column('character varying', { name: 'open_time', nullable: true })
  open_time: string;

  @Column('character varying', { name: 'close_time', nullable: true })
  close_time: string;

  @Column('character varying', {
    name: 'store_type',
    nullable: false,
    default: 'DEFAULT',
  })
  store_type: string;

  @Column({ nullable: true })
  status: StoreStatus;

  @Column({ name: 'is_delivery_enabled', nullable: true })
  isDeliveryEnabled: number;

  @Column('jsonb', {
    name: 'images',
    array: false,
    default: () => "'[]'",
    nullable: true,
  })
  images: Any;

  @Column('jsonb', {
    name: 'metadata',
    array: false,
    nullable: true,
  })
  metadata: object;

  @Column('jsonb', {
    name: 'offer_images',
    array: false,
    default: () => "'[]'",
    nullable: true,
  })
  offerImages: object;

  @Column('character varying', { name: 'poc_name' })
  pocName: string;

  @Column('character varying', { name: 'poc_contact_no' })
  pocContactNo: string;

  @Column('boolean', { name: 'collect_cash', default: false })
  collectCash: boolean;

  @Column('boolean', { name: 'is_unloading_reqd', default: true })
  isUnloadingReqd: boolean;

  @Column('character varying', { name: 'store_category' })
  storeCategory: string;

  @Column('integer', { name: 'easebuzz_virtual_account_id' })
  easebuzzVirtualAccountId: number;

  @Column('character varying', { name: 'easebuzz_qr_code' })
  easebuzzQrCode: string;

  @Column('uuid', {
    name: 'created_by',
  })
  createdBy: string;

  @Column('uuid', {
    name: 'approved_by',
  })
  approvedBy: string;

  @Column('jsonb', {
    name: 'store_images',
    nullable: true,
  })
  storeImages: object;

  @Column({ name: 'delivery_open_time', type: 'time', nullable: true })
  deliveryOpenTime: string;

  @Column('character varying', { name: 'store_location_type' })
  storeLocationType: string;

  @Column('character varying', { name: 'store_delivery_type' })
  storeDeliveryType: string;

  @Column({
    name: 'inventory_view',
    type: 'enum',
    enum: InventoryView,
  })
  inventoryView: InventoryView;

  @Column('character varying', { name: 'store_subtype' })
  storeSubtype: string;

  @Column('integer', { name: 'sales_potential', nullable: true })
  salesPotential: number;
}
