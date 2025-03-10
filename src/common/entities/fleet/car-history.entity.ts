import { Entity, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { Car, CarDocument } from '..';
import { Base } from '../base';
import { CarHistoryRecordType } from '@/common/enums';

@Entity('car_history_records')
export class CarHistoryRecord extends Base {
  @ManyToOne(() => Car, (car) => car.history, {onDelete: 'CASCADE'})
  car!: Car;

  @Column({
    type: 'enum',
    enum: CarHistoryRecordType,
  })
  type!: CarHistoryRecordType;

  @Column({ type: 'timestamp' })
  date!: Date;

  @Column('text')
  description!: string;

  @Column({ nullable: true })
  mileageAtTime?: number;

  @Column('jsonb', { nullable: true })
  cost?: {
    amount: number;
    currency: string;
  };

  @Column({ nullable: true })
  performedBy?: string; //user's name

  @ManyToMany(() => CarDocument)
  @JoinTable()
  documents?: CarDocument[];

  @Column({ type: 'timestamp', nullable: true })
  nextScheduledDate?: Date;
}
