import { Column, Entity, ManyToOne } from 'typeorm';
import { Base } from '../base';
import { Car } from '..';
import { CarPricingUnit } from '@/common/enums';

@Entity()
export class RentalPricing extends Base {
  @ManyToOne(() => Car, (car) => car.rentalPricings, { onDelete: 'CASCADE' })
  car!: Car;

  @Column()
  duration!: number;

  @Column({enum: CarPricingUnit})
  unit!: CarPricingUnit; // "hour" | "day" | "week" | "month" | "year"

  @Column()
  price!: number;

  @Column()
  currency!: string; // e.g., "USD", "EUR", usdt (also want to handle crypto payments. we could make this better)
}
