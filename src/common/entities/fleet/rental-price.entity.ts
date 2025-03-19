import { Column, Entity, ManyToOne } from 'typeorm';
import { Base } from '../base';
import { Car } from '..';
import { CarPricingUnit, SupportedCryptoCurrencies, SupportedCurrencies, SupportedFiatCurrencies } from '@/common/enums';

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

  @Column()
  mileageLimit!: number; // mileage limit in KM

  @Column({ enum: [...Object.values(SupportedCryptoCurrencies), ...Object.values(SupportedFiatCurrencies)] })
  currency!: SupportedCurrencies;
}
