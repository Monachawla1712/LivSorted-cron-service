import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity({ name: 'ppd_dispatch' })
export class PpdDispatchEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  zone: string;

  @Column()
  delivery_date: Date;

  @CreateDateColumn()
  created_on: Date;

  @UpdateDateColumn()
  modified_on: Date;

  @Column()
  created_by: string;

  @Column()
  modified_by: string;
}
