import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'mm_routing_table' })
export class MmRoutingTableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true, name: 'user_id' })
  userId: number;

  @Column({ type: 'int', nullable: false, name: 'wh_id' })
  whId: number;

  @Column({ type: 'int', nullable: false, name: 'store_id' })
  storeId: number;

  @Column({ type: 'int', nullable: false })
  route: number;

  @Column({ type: 'time', nullable: false, name: 'store_opening_time' })
  storeOpeningTime: string;

  @Column({ type: 'date', nullable: false, name: 'delivery_date' })
  deliveryDate: string;

  @Column({ type: 'varchar', length: 15, nullable: false })
  slot: string;

  @Column({
    type: 'tinyint',
    nullable: false,
    default: 0,
    name: 'driver_unloaded',
  })
  driverUnloaded: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  status: string;

  @Column({ type: 'json', nullable: true })
  metadata: object;

  @Column({ type: 'tinyint', nullable: false, default: 1 })
  active: number;

  @UpdateDateColumn({ type: 'datetime', nullable: false, name: 'modified_on' })
  modifiedOn: Date;

  @Column({ type: 'int', nullable: false, name: 'modified_by' })
  modifiedBy: number;

  @CreateDateColumn({ type: 'datetime', nullable: false, name: 'created_on' })
  createdOn: Date;

  @Column({ type: 'int', nullable: false, name: 'created_by' })
  createdBy: number;

  @Column({ type: 'time', nullable: false, name: 'dispatch_time' })
  dispatchTime: string;

  static newInstance(
    routeNum: number,
    whId: number,
    deliveryDate: string,
    storeId: number,
    slot: string,
    status: string,
    deliveryOpenTime: string,
    dispatchTime: string,
  ) {
    const entity = new MmRoutingTableEntity();
    entity.route = routeNum;
    entity.createdBy = -1;
    entity.modifiedBy = -1;
    entity.deliveryDate = deliveryDate;
    entity.whId = whId;
    entity.storeOpeningTime = deliveryOpenTime;
    entity.storeId = storeId;
    entity.status = status;
    entity.slot = slot;
    entity.dispatchTime = dispatchTime;
    return entity;
  }
}