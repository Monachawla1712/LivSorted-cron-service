import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../core/common/common.entity';

@Entity({ name: 'user_wallet', schema: 'payment' })
export class WalletEntity extends CommonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entity_id: string;

  @Column({ type: 'numeric' })
  amount: string;

  @Column()
  entity_type: string;
}
