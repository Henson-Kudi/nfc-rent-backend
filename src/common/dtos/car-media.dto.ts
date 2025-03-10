import { MediaType } from "@/common/enums";
import { Expose } from "class-transformer";

export class CarMediaDto {
    @Expose()
    url!: string;
    @Expose()
    type!: MediaType;
    @Expose()
    isThumbnail!: boolean;
    @Expose()
    title?: string;
    @Expose()
    description?: string;
    @Expose()
    position!: number;
}