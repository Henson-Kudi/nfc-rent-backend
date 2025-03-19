import { Entity, OneToOne, Column, BeforeInsert, BeforeUpdate, OneToMany } from 'typeorm'
import { Booking, ContractVoilation } from '..'
import { Base } from '../base'
import { generateAlphaNumNanoId } from '@/common/utils/custom-nano-id'

@Entity()
export class Contract extends Base {
    @OneToOne(() => Booking, (booking) => booking.contract)
    booking!: Booking

    @Column({ unique: true })
    number!: string

    @Column()
    templatePath?: string // If we want to use dynamic templating. Would default to system template

    @Column()
    signedAt?: Date // Date contract was signed by client

    @Column()
    clientSignature?: string // blob image of client's signature

    @Column()
    additionalDriverSign?: string // Signature of client's driver (if any). Blob string

    @Column('jsonb')
    damages?: CarDamage[]

    @OneToMany(() => ContractVoilation, (voilation) => voilation.contract)
    violations?: ContractVoilation[]


    @Column({ type: "int", comment: "Fuel level as percentage (0-100)", })
    fuelLevelPickup!: number;

    @Column({ type: "int", comment: "Fuel level as percentage (0-100)", nullable: true })
    fuelLevelReturn?: number;

    @Column({ type: "int" })
    mileageAtPickup!: number

    @Column({ type: "int", nullable: true })
    mileageAtReturn?: number

    @Column({ default: false })
    isReturned!: boolean

    @Column({ default: false })
    isTerminated!: boolean

    @Column({ type: "text", nullable: true })
    terminationReason?: string

    @Column({ type: "varchar", length: 255, nullable: true })
    pdfUrl?: string

    @Column({ default: false })
    isSigned!: boolean

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    totalViolationCharges!: number

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    totalDeductions!: number // total to be deducted from security deposit

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    refundAmount?: number // Amount to be refunded after all deductions are made

    @BeforeInsert()
    @BeforeUpdate()
    genContractNumber() {
        this.number = generateAlphaNumNanoId('NFC-CNT')
    }
}