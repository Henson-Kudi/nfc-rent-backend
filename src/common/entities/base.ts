import cuid2 from '@paralleldrive/cuid2';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

// All our schemas will have these fields, thus its good to have it as a base class to be extended by other schemas
export abstract class Base {
  @PrimaryColumn()
  id!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ type: Date })
  createdAt?: Date;

  @UpdateDateColumn({ type: Date })
  updatedAt?: Date;

  @DeleteDateColumn({ type: Date })
  deletedAt?: Date;

  @BeforeInsert()
  addId() {
    if (!this.id) {
      this.id = cuid2.createId();
    }
  }
}
