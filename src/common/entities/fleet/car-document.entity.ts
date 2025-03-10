import { Entity, Column, ManyToOne } from 'typeorm';
import { Car } from '..';
import { CarDocumentType } from '@/common/enums';
import { Base } from '../base';

@Entity()
export class CarDocument extends Base {
  @Column({
    type: 'enum',
    enum: CarDocumentType,
  })
  type!: CarDocumentType;

  @Column()
  title!: string;

  @Column()
  fileUrl!: string;

  @Column({ type: 'timestamp' })
  issueDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate?: Date;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verificationDate?: Date;

  @ManyToOne(() => Car, (car) => car.documents, { onDelete: 'CASCADE' })
  car!: Car;
}
