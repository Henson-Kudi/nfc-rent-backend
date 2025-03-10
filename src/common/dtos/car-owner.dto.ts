import { Expose } from "class-transformer";
import { BaseDto } from "./base.dto";

export class CarOwnershipDetailDto extends BaseDto {
    @Expose()
    car?: unknown;
    @Expose()
    owner?: unknown;
    @Expose()
    ownerType!: 'User' | 'Company';
    @Expose()
    percentage!: number;
    @Expose()
    nftId?: string;
    @Expose()
    acquiredDate!: Date;
    @Expose()
    transferDate?: Date;
    @Expose()
    status!: 'Active' | 'Pending' | 'Transferred';
}