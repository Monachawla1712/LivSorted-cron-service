import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { EventRules } from './classes/event-conditions';

@Entity({ name: 'events', schema: 'event' })
export class EventEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'audience_id' })
  audienceId: number;

  @Column()
  title: string;

  @Column('jsonb')
  rules: EventRules;

  @Column()
  frequency: number;

  @Column()
  active: number;

  @Column({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'modified_at' })
  modifiedAt: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'modified_by' })
  modifiedBy: string;

  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ name: 'end_date' })
  endDate: Date;
}
