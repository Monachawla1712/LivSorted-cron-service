import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ schema: 'ticket', name: 'tickets' })
export class TicketEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'requester_entity_type' })
  requester_entity_type: string;

  @Column({ name: 'requester_entity_id' })
  requester_entity_id: string;

  @Column({ name: 'requester_entity_category', nullable: true })
  requester_entity_category: string | null;

  @Column({ name: 'reference_id', nullable: true })
  reference_id: string | null;

  @Column({ name: 'category_root_id' })
  category_root_id: number;

  @Column({ name: 'draft_count' })
  draft_count: number;

  @Column({ name: 'pending_count' })
  pending_count: number;

  @Column({ name: 'closed_count' })
  closed_count: number;

  @Column({ name: 'cancelled_count' })
  cancelled_count: number;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: object;

  @Column({ name: 'last_added_at' })
  last_added_at: Date;

  @Column({ name: 'created_at', default: () => 'NOW()' })
  created_at: Date;

  @Column({ name: 'modified_at', default: () => 'NOW()' })
  modified_at: Date;

  @Column({ name: 'created_by' })
  created_by: string;

  @Column({ name: 'modified_by' })
  modified_by: string;

  @Column({ default: 1 })
  active: number;
}
