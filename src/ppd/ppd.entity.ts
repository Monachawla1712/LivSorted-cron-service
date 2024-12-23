import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity({ name: 'ppd_orders' })
export class PpdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: string;

  @Column()
  display_order_id: string;

  @Column()
  sequence_no: number;

  @Column()
  zone: string;

  @Column()
  distance: number;

  @Column()
  picker_user_id: number;

  @Column()
  packer_user_id: number;

  @Column()
  supervisor_user_id: number;

  @Column('json')
  metadata: object;

  @Column('json')
  order_items: object;

  @Column()
  status: string;

  @Column()
  route: number;

  @Column({ type: 'date' })
  delivery_date: string;

  @CreateDateColumn()
  created_on: Date;

  @UpdateDateColumn()
  modified_on: Date;

  @Column()
  created_by: string;

  @Column()
  modified_by: string;

  @Column()
  pps: number;
}
