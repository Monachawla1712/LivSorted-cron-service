import {
  Column,
  Entity,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('inventory', { schema: 'store' })
export class InventoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quantity: number;

  @Column()
  market_price: number;

  @Column()
  sale_price: number;

  @Column()
  sku_code: string;

  @Column('jsonb')
  price_brackets: object[];

  @Column()
  store_id: string;

  @Column()
  is_active: boolean;

  @Column()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column()
  updated_by: string;
}
