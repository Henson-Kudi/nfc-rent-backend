import { Column, Entity, ManyToOne, OneToMany, ManyToMany, JoinTable, JoinColumn } from "typeorm";
import { Base } from "../base";
import { CarBrand, CarFeature, CarModel, RentalPricing, CarMedia, CarDocument, CarOwnershipDetail, CarHistoryRecord } from "..";
import { CarCategory, CarCondition, CarInspectionStatus, CarListingType, CarStatus, FuelType, TransmissionType } from "@/common/enums";
import { TranslationEntity } from "../translation-base";

@Entity()
export class Car extends Base {
    @Column({ unique: true })
    slug!: string; // slugified car name in english

    @Column({ unique: true })
    vin!: string;

    @Column({ nullable: true })
    blockchainId?: string; // for blockchain integration

    @Column()
    year!: number;

    @Column({
        type: 'enum',
        enum: CarCategory,
    })
    category!: CarCategory;

    @Column({
        type: 'enum',
        enum: FuelType,
    })
    fuelType!: FuelType;

    @Column({
        type: 'enum',
        enum: TransmissionType,
    })
    transmission!: TransmissionType;

    @Column()
    doors!: number;

    @Column()
    seats!: number;

    @Column('jsonb')
    engineSpecs!: {
        type: string;
        horsepower: number;
        torque: number;
        displacement?: number;
        batteryCapacity?: number;
        range?: number;
        acceleration: number;
        topSpeed: number;
    };

    @Column('jsonb')
    dimensions!: {
        length: number;
        width: number;
        height: number;
        weight: number;
        cargoCapacity: number;
    };

    @OneToMany(() => CarMedia, mediaItem => mediaItem.car)
    images!: CarMedia[];

    @OneToMany(() => CarMedia, mediaItem => mediaItem.car)
    videos!: CarMedia[];

    @Column({ nullable: true })
    virtualTourUrl?: string;

    @Column({ nullable: true })
    metaverseAssetId?: string; // during blockchain integration

    @Column({
        type: 'enum',
        enum: CarStatus,
        default: CarStatus.AVAILABLE
    })
    currentStatus!: CarStatus;

    @Column({ type: 'simple-array', default: [CarListingType.FOR_RENT] })
    listingType!: CarListingType[];

    @Column({ type: 'timestamp', nullable: true })
    acquisitionDate?: Date;

    @Column()
    mileage!: number;

    @Column({
        type: 'enum',
        enum: CarCondition,
        default: CarCondition.EXCELLENT
    })
    condition!: CarCondition;

    @Column({
        type: 'enum',
        enum: CarInspectionStatus,
        default: CarInspectionStatus.PENDING
    })
    inspectionStatus!: CarInspectionStatus;

    @Column({ type: 'timestamp', nullable: true })
    lastInspectionDate?: Date;

    @Column({ type: 'timestamp', nullable: true })
    nextInspectionDueDate?: string;

    // Relationships
    @ManyToOne(() => CarBrand)
    brand!: CarBrand;

    @ManyToOne(() => CarModel)
    model!: CarModel;

    @ManyToMany(() => CarFeature)
    @JoinTable()
    features!: CarFeature[];

    @OneToMany(() => RentalPricing, pricing => pricing.car)
    rentalPricings!: RentalPricing[];

    @OneToMany(() => CarDocument, doc => doc.car)
    documents!: CarDocument[];

    @OneToMany(() => CarOwnershipDetail, ownerDetail => ownerDetail.car)
    ownershipDetails!: CarOwnershipDetail[];

    @OneToMany(() => CarHistoryRecord, history => history.car)
    history!: CarHistoryRecord[];

    @OneToMany(() => CarTranslation, translation => translation.parent)
    translations!: CarTranslation[];
}

@Entity()
export class CarTranslation extends TranslationEntity<Car> {
    @Column({ type: 'jsonb' })
    color!: {
        name: string,
        code?: string
    };

    @Column({ type: 'jsonb' })
    interiorColor!: {
        name: string,
        code?: string
    };

    @ManyToOne(() => Car, car => car.translations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parentId' })
    parent!: Car;

    @Column({})
    name!: string

    @Column({ nullable: true })
    shortDescription?: string

    @Column({ nullable: true })
    description?: string

    @Column({ nullable: true })
    metaTitle?: string

    @Column({ nullable: true })
    metaDescription?: string

    @Column({ nullable: true })
    metaTags?: string
}