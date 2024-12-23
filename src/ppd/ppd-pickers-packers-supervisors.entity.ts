import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'ppd_zone_picker_packer' })
export class PpdPickersPackersSupervisorsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  zone: string;

  @Column({ name: 'picker_id' })
  pickerId: number;

  @Column({ name: 'packer_id' })
  packerId: number;

  @Column({ name: 'supervisor_id' })
  supervisorId: number;

  @Column({ type: 'date' })
  delivery_date: string;

  @Column()
  active: number;

  @CreateDateColumn()
  created_on: Date;

  @UpdateDateColumn()
  modified_on: Date;

  @Column()
  created_by: string;

  @Column()
  modified_by: string;
}
