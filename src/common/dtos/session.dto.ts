import { BaseDto } from "./base.dto";
import { Expose } from "class-transformer";

export class SessionDto extends BaseDto {
    @Expose()
    userId!: string;
    @Expose()
    refreshToken!: string;
    @Expose()
    device!: string;
    @Expose()
    location!: string;
    @Expose()
    expiresAt!: Date;
    @Expose()
    isActive!: boolean;
    @Expose()
    loggedOutAt?: Date;
    @Expose()
    lastActiveAt!: Date;
}