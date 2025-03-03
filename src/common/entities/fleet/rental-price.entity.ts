import { Column, Entity, ManyToOne } from "typeorm";
import { Base } from "../base";
import { Car } from "..";

@Entity()
export class RentalPricing extends Base {

    @ManyToOne(() => Car, car => car.rentalPricings)
    car!: Car;

    @Column()
    duration!: number;

    @Column()
    unit!: 'hour' | 'day' | 'week' | 'month' | 'year';

    @Column()
    price!: number;

    @Column()
    currency!: string; // e.g., "USD", "EUR"
}