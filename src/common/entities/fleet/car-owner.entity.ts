import { Entity, Column, ManyToOne } from 'typeorm';
import { Car, User } from '..';
import { Base } from '../base';

@Entity('ownership_details')
export class CarOwnershipDetail extends Base {

    @ManyToOne(() => Car, car => car.ownershipDetails)
    car!: Car;

    @ManyToOne(() => User, user => user.ownedCars, { nullable: true })
    owner!: User;

    @Column()
    ownerType!: 'User' | 'Company';

    @Column('decimal', { precision: 5, scale: 2 })
    percentage!: number;

    @Column({ nullable: true })
    nftId?: string; // when integrating blockchain. Each nft would be attached to a car

    @Column({ type: 'timestamp' })
    acquiredDate!: Date;

    @Column({ type: 'timestamp', nullable: true, })
    transferDate?: Date;

    @Column()
    status!: 'Active' | 'Pending' | 'Transferred';
}