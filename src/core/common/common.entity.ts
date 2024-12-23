import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export class CommonEntity {
  @Column()
  active: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  modified_at: Date;

  @Column('uuid', { nullable: true })
  created_by: string;

  @Column('uuid', { nullable: true })
  modified_by: string;
}
