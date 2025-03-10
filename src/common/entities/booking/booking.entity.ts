import { BookingStatus } from "@/common/enums";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToOne } from "typeorm";
import { Car, User, Payment, Driver, Addon } from "..";
import { Base } from "../base";

@Entity()
export class Booking extends Base {
    @ManyToOne(() => User, (user) => user.bookings)
    user!: User;

    @ManyToOne(() => Driver, driver => driver.bookings)
    driver!: Driver

    @ManyToOne(() => Car, (car) => car.bookings)
    car!: Car;

    @Column({ type: 'timestamptz' })
    pickupDate!: Date;

    @Column({ type: 'timestamptz' })
    returnDate!: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalAmount!: number;

    @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
    status!: BookingStatus;

    @OneToOne(() => Payment, (payment) => payment.booking)
    payment!: Payment;

    @ManyToMany(() => Addon, (addon) => addon.bookings)
    selectedAddons?: Addon[];

    @Column({ nullable: true })
    cancellationReason?: string;

    @Column({ type: 'jsonb', nullable: true })
    priceBreakdown?: Record<string, any>;
}