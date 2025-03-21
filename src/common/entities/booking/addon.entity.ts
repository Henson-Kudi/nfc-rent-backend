import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { Booking, Car } from '..';
import { Base } from '../base';

@Entity()
export class Addon extends Base {
  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column('jsonb')
  priceOptions!: {
    type: 'per_rental' | 'per_day';
    amount: number;
    currency: string;
  }[];

  @Column({ default: false })
  isRequired!: boolean;

  @ManyToMany(() => Car, (car) => car.availableAddons)
  @JoinTable()
  availableForCars!: Car[];

  @ManyToMany(() => Booking, (booking) => booking.selectedAddons)
  @JoinTable()
  bookings!: Booking[];
}
