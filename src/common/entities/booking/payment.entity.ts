import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Base } from "../base";
import { Booking } from "..";
import { PaymentStatus } from "@/common/enums";

@Entity()
export class Payment extends Base {
    @OneToOne(() => Booking, (booking) => booking.payment)
    @JoinColumn()
    booking!: Booking;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount!: number;

    @Column()
    currency!: string;

    @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
    status!: PaymentStatus;

    @Column({ nullable: true })
    transactionId?: string;

    @Column({ nullable: true })
    paymentMethod?: string;

    @Column({ nullable: true })
    cryptoAddress?: string;

    @Column({ type: 'timestamptz', nullable: true })
    paidAt?: Date;

    @Column({ type: 'jsonb', nullable: true })
    paymentMetadata?: Record<string, any>;
}