import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products', { schema: 'store' })
export class ProductEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sku_code: string;

  @Column()
  category_id: number;

  @Column()
  name: string;

  @Column()
  packet_description: string;

  @Column()
  image_url: string;

  @Column('jsonb')
  tags: object[];

  @Column()
  serves1: number;

  @Column()
  is_active: boolean;

  @Column()
  unit_of_measurement: string;

  @Column()
  market_price: number;

  @Column()
  sale_price: number;

  @Column()
  per_pcs_weight: number;

  @Column()
  per_pcs_suffix: string;

  @Column()
  per_pcs_buffer: number;

  @Column()
  display_name: string;

  @Column()
  min_quantity: number;

  @Column()
  max_quantity: number;

  @Column()
  buffer_quantity: number;

  @Column()
  enable_pieces_request: boolean;

  @Column()
  lithos_ref: number;

  @Column()
  created_at: Date;

  @Column()
  updated_at: Date;

  @Column()
  updated_by: string;

  @Column()
  icon_url: string;

  @Column('jsonb')
  metadata: object;

  @Column('jsonb')
  videos: string[];
}
