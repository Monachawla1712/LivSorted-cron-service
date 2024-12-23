import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../core/common/common.entity';

@Entity({ name: 'wallet_statement', schema: 'payment' })
export class WalletStatementEntity extends CommonEntity {
  @PrimaryGeneratedColumn()
  id: bigint;

  @Column()
  entity_id: string;

  @Column()
  amount: string;

  @Column()
  balance: string;

  @Column()
  txn_mode: string;

  @Column()
  txn_type: string;

  @Column()
  txn_detail: string;

  @Column()
  entity_type: string;
}
