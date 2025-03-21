import { BookingStatus, SupportedCurrencies } from '@/common/enums';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { Car, User, Payment, Driver, Addon, Contract } from '..';
import { Base } from '../base';
import { generateAlphaNumNanoId } from '@/common/utils/custom-nano-id';

@Entity()
export class Booking extends Base {
  @ManyToOne(() => User, (user) => user.bookings)
  user!: User;

  @ManyToOne(() => Driver, (driver) => driver.bookings)
  driver!: Driver;

  @ManyToOne(() => Car, (car) => car.bookings)
  car!: Car;

  @Column({ type: 'timestamptz' })
  pickupDate!: Date;

  @Column({ type: 'timestamptz' })
  returnDate!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount!: number;

  @Column('jsonb')
  securityDeposit!: {
    currency: SupportedCurrencies;
    amount: number;
  };

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status!: BookingStatus;

  @OneToOne(() => Payment, (payment) => payment.booking)
  payment!: Payment;

  @OneToOne(() => Contract, (contract) => contract.booking)
  contract?: Contract;

  @ManyToMany(() => Addon, (addon) => addon.bookings)
  selectedAddons?: Addon[];

  @Column({ nullable: true })
  cancellationReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  priceBreakdown?: Record<string, unknown>;

  @Column({ unique: true })
  number!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  plateNumber?: string;

  @BeforeInsert()
  @BeforeUpdate()
  generateBookingNumber() {
    this.number = generateAlphaNumNanoId('NFC-BKN');
  }
}
