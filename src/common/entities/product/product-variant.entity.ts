import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from "typeorm";
import { Base } from "../base";
import { Product, ProductAttributeOption } from "..";

@Entity()
export class ProductVariant extends Base {

    @ManyToOne(() => Product, (product) => product.variants)
    product!: Product;

    @Column()
    sku!: string; // e.g., "TSHIRT-RED-L"

    // Inventory
    @Column({ type: 'int', nullable: true })
    stock!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    priceOffset!: number; // +/- from base price

    // Selected options for this variant
    @ManyToMany(() => ProductAttributeOption)
    @JoinTable()
    attributes!: ProductAttributeOption[];
}