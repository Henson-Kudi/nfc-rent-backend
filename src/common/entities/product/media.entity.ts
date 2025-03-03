import { Column, Entity, ManyToOne } from "typeorm";
import { Base } from "../base";
import { Product } from "..";
import { MediaType } from "@/common/enums";

@Entity()
export class ProductMedia extends Base {

    @Column()
    url!: string;

    @Column({ type: 'enum', enum: MediaType })
    type!: MediaType;

    @ManyToOne(() => Product, (p) => p.media)
    product!: Product;
}