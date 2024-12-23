import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'suggestions', schema: 'store' })
export class SuggestionEntity extends BaseEntity {
  constructor(
    entityType: string,
    entityId: string,
    skuCode: string,
    avgQty: string,
    suggestionType: string,
    userId: string,
  ) {
    super();
    this.entityType = entityType;
    this.entityId = entityId;
    this.skuCode = skuCode;
    this.quantity = avgQty;
    this.suggestionType = suggestionType;
    this.modifiedBy = userId;
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'entity_type' })
  entityType: string;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'suggestion_type' })
  suggestionType: string;

  @Column({ name: 'sku_code' })
  skuCode: string;

  @Column()
  quantity: string;

  @Column()
  active: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @UpdateDateColumn({ name: 'modified_at' })
  modifiedAt: Date;

  @Column({ name: 'modified_by' })
  modifiedBy: string;

  @BeforeInsert()
  async setCreatedBy() {
    this.createdBy = this.modifiedBy;
  }
}
