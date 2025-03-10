import { Column, Entity, Index, ManyToOne, OneToMany } from "typeorm";
import { Base } from "../base";
import { Booking, User } from "..";
import { DriverType } from "@/common/enums";

@Entity()
@Index(['user', 'idNumber'], { unique: true, where: '"idNumber" IS NOT NULL' })
@Index(['user', 'licenseNumber'], { unique: true, where: '"licenseNumber" IS NOT NULL' })
@Index(['user', 'passportNumber'], { unique: true, where: '"passportNumber" IS NOT NULL' })
@Index(['user', 'email'], { unique: true, })
@Index(['user', 'phoneNumber'], { unique: true, })
export class Driver extends Base {
    @ManyToOne(() => User, (user) => user.drivers, { onDelete: 'CASCADE' })
    user!: User;

    @OneToMany(() => Booking, (booking) => booking.driver)
    bookings!: Booking[];

    // Personal Details
    @Column()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column()
    email!: string;

    @Column()
    phoneNumber!: string;

    @Column({ type: 'date' })
    dateOfBirth!: Date;

    @Column()
    country!: string;

    @Column({ enum: DriverType })
    driverType!: DriverType


    // ID details
    @Column({ nullable: true })
    idNumber?: string;

    @Column({ nullable: true, type: 'date' })
    idIssueDate?: Date;

    @Column({ nullable: true, type: 'date' })
    idExpiryDate?: Date;

    @Column({ nullable: true })
    idFrontImage?: string;

    @Column({ nullable: true })
    idBackImage?: string;

    // License Details
    @Column()
    licenseNumber!: string;

    @Column({ nullable: true, type: 'date' })
    licenseIssueDate?: Date;

    @Column({ nullable: true, type: 'date' })
    licenseExpiryDate?: Date;

    @Column({ nullable: true })
    licenseFrontImage?: string;

    @Column({ nullable: true })
    licenseBackImage?: string;

    // Passport information
    @Column({ nullable: true })
    passportNumber!: string;

    @Column({ nullable: true, type: 'date' })
    passportIssueDate?: Date;

    @Column({ nullable: true, type: 'date' })
    passportExpiryDate?: Date;

    @Column({ nullable: true })
    passportFrontImage?: string;

    @Column({ nullable: true })
    passportBackImage?: string;

    // Visa Information
    @Column({ nullable: true })
    visaNumber?: string;

    @Column({ nullable: true, type: 'date' })
    visaIssueDate?: Date;

    @Column({ nullable: true, type: 'date' })
    visaExpiryDate?: Date;

    @Column({ nullable: true })
    visaImage?: string;

    // Others
    @Column({ type: 'boolean', default: false })
    isDefault!: boolean;

    @Column({ type: 'jsonb', nullable: true })
    additionalDocuments?: Array<{
        url: string;
        type: string;
        documentNumber: string;
        expiryDate: Date;
    }>;
}