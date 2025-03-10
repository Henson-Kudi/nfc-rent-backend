import { BaseDto } from "./base.dto";
import { Expose } from "class-transformer";

export class RoleDto extends BaseDto {
    @Expose()
    name!: string;
    @Expose()
    slug!: string;
}