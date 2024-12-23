import { Entity, PrimaryGeneratedColumn } from 'typeorm';
import { STORE_REQUISITIONS_TABLE_NAME } from './dm.constants';

@Entity({ name: STORE_REQUISITIONS_TABLE_NAME })
export class StoreRequisitionsWhEntity {
  @PrimaryGeneratedColumn()
  id: number;
}
