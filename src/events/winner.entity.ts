import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { WinnerInfo } from './classes/winner-info';
import { Prize } from './classes/event-conditions';

@Entity({ name: 'winners', schema: 'event' })
export class WinnerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'event_id' })
  eventId: number;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'entity_type' })
  entityType: string;

  @Column()
  position: number;

  @Column('jsonb', { name: 'winner_info' })
  winnerInfo: WinnerInfo;

  @Column('date')
  date: Date;

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

  static createNewWinner(
    eventId: number,
    entityId: string,
    entityType: string,
    position: number,
    prize: Prize,
    date: Date,
    userId: string,
  ) {
    const winner = new WinnerEntity();
    winner.eventId = eventId;
    winner.entityId = entityId;
    winner.entityType = entityType;
    winner.position = position;
    winner.winnerInfo = new WinnerInfo(prize);
    winner.date = date;
    winner.createdBy = userId;
    winner.modifiedBy = userId;
    return winner;
  }
}
