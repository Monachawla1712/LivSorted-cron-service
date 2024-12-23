import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'mm_routes_distance' })
export class MmRoutesDistanceEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number;

  @Column({ name: 'wh_id', type: 'int' })
  whId: number;

  @Column({ type: 'int' })
  route: number;

  @Column({ name: 'delivery_date', type: 'date' })
  deliveryDate: string;

  @Column({ type: 'varchar', length: 15 })
  slot: string;

  @Column({ name: 'total_route_distance', type: 'double' })
  totalRouteDistance: number;

  // @Column({ name: 'total_route_followed_distance', type: 'double' })
  // totalRouteFollowedDistance: number;

  static newInstance(
    deliveryDate: string,
    slot: string,
    route: number,
    whId: number,
    userId: number,
    totalRouteDistance: number,
  ) {
    const mmRoutesDistanceEntity = new MmRoutesDistanceEntity();
    mmRoutesDistanceEntity.deliveryDate = deliveryDate;
    mmRoutesDistanceEntity.slot = slot;
    mmRoutesDistanceEntity.route = route;
    mmRoutesDistanceEntity.whId = whId;
    mmRoutesDistanceEntity.userId = userId;
    mmRoutesDistanceEntity.totalRouteDistance = totalRouteDistance;
    return mmRoutesDistanceEntity;
  }
}
