import { Column, Entity, ManyToOne } from 'typeorm';
import { Base } from '../base';
import { Car } from '..';
import { CarPricingUnit, SupportedCurrencies } from '@/common/enums';

@Entity()
export class RentalPricing extends Base {
  @ManyToOne(() => Car, (car) => car.rentalPricings, { onDelete: 'CASCADE' })
  car!: Car;

  @Column()
  duration!: number;

  @Column({ enum: CarPricingUnit })
  unit!: CarPricingUnit; // "hour" | "day" | "week" | "month" | "year"

  @Column()
  price!: number;

  @Column({ enum: SupportedCurrencies })
  currency!: SupportedCurrencies; // e.g., "USD", "EUR", "USDT" (also want to handle crypto payments. we could make this better)
}
