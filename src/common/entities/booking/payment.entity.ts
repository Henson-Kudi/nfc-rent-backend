import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Base } from "../base";
import { AddressMapping, Booking } from "..";
import { PaymentStatus, SupportedCryptoCurrencies, SupportedCurrencies, SupportedFiatCurrencies } from "@/common/enums";

@Entity()
export class Payment extends Base {
    @OneToOne(() => Booking, (booking) => booking.payment)
    @JoinColumn()
    booking!: Booking;

    @OneToOne(() => AddressMapping, (mapper) => mapper.payment)
    @JoinColumn()
    addressMap!: AddressMapping;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount!: number;

    @Column({ enum: [...Object.values(SupportedCryptoCurrencies), ...Object.values(SupportedFiatCurrencies), ], type: 'enum' })
    currency!: SupportedCurrencies;

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

    @Column({ type: 'boolean', default: false })
    isCrypto?: boolean;
}