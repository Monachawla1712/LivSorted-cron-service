import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { SSP_TABLE_NAME } from './dm.constants';

@Entity({ name: SSP_TABLE_NAME })
export class StoresecondarypickingWhEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  store_id: number;

  @Column()
  sku_code: string;

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
