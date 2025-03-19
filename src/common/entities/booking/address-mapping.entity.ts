import { BeforeInsert, BeforeUpdate, Column, Entity, OneToOne } from "typeorm";
import { Base } from "../base";
import { Payment } from "..";
import { SupportedCryptoCurrencies } from "@/common/enums";

@Entity()
export class AddressMapping extends Base {

    @OneToOne(() => Payment, payment => payment.addressMap)
    payment!: Payment

    @Column({ enum: SupportedCryptoCurrencies })
    currency!: SupportedCryptoCurrencies

    @Column()
    walletAddress!: string

    @Column()
    derivationPath!: string
    @Column('int')
    derivationIndex!: number

    @Column()
    requestedAmount!: string

    @Column()
    estimatedGasFee!: string

    @Column()
    totalRequested!: string

    @Column({ type: 'jsonb', default: [] })
    deposits!: {
        txHash: string,
        amount: string,
        gasFee: string,
        timestamp: Date,
        processed: boolean
    }[]

    @Column('timestamp')
    lastChecked!: Date

    @Column('timestamp')
    expiresAt!: Date

    @BeforeInsert()
    @BeforeUpdate()
    getIndex() {
        this.derivationIndex = parseInt(this.derivationPath.split('/').pop() || "0")
    }
}