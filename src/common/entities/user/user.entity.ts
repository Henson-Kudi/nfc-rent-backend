import { LoginType, TOTPStatus } from "@/common/enums"
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from "typeorm"
import { Base } from "../base"
import { Session, OTP, Role, CarOwnershipDetail } from ".."
import { Exclude } from "class-transformer"

@Entity()
export class User extends Base {
    @Column({ nullable: false })
    fullName!: string

    @Column({ unique: true, nullable: false })
    email!: string

    @Column({ unique: true })
    phone?: string

    @Column()
    photo?: string

    @Column({ nullable: true })
    googleId?: string

    @Exclude()
    @Column({ nullable: true })
    password?: string

    @Column({ enum: LoginType, default: LoginType.EMAIL })
    loginType!: LoginType

    @Column({ type: 'boolean', default: false })
    emailVerified!: boolean

    @Column({ type: 'boolean', default: false })
    phoneVerified!: boolean

    @Column({ type: 'boolean', default: false })
    mfaEnabled!: boolean

    @Column({ nullable: true })
    totpSecret?: string

    @Column({ nullable: true, enum: TOTPStatus })
    totpStatus?: TOTPStatus

    @OneToMany(() => Session, (session) => session.user)
    sessions!: Session[]

    @OneToMany(() => OTP, (otp) => otp.user)
    otps!: OTP[]

    @OneToMany(() => CarOwnershipDetail, (ownedCar) => ownedCar.owner)
    ownedCars!: CarOwnershipDetail[]

    @ManyToMany(() => Role, role => role.users)
    @JoinTable()
    roles!: Role[];

    @Column({ type: 'json', nullable: true })
    cachedPermissions?: string[];
}




