import { BeforeInsert, Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany } from "typeorm";
import { Base } from "../base";
import { ProductStatus, ProductType } from "@/common/enums";
import { ProductCategory, ProductTag, ProductAttributeGroup, ProductBrand, ProductVariant, ProductMedia, Supplier } from "..";
import slugify from "@/common/utils/slugify";
import cuid2 from "@paralleldrive/cuid2";

@Entity()
export class Product extends Base {

    // Basic Info
    @Column()
    name!: string;

    @Column({ unique: true })
    slug!: string;

    @Column({ unique: true })
    sku!: string; // Stock Keeping Unit (unique per organization)

    @Column({ type: 'text', nullable: true })
    description?: string;

    // Inventory Control
    @Column({ default: true })
    trackInventory?: boolean; // False for services/digital products

    @Column({ type: 'enum', enum: ProductType, default: ProductType.PHYSICAL })
    productType?: ProductType;

    @ManyToOne(() => Supplier, { nullable: true })
    supplier?: Supplier;

    // Taxonomy & Classification
    @ManyToMany(() => ProductCategory)
    @JoinTable()
    categories!: ProductCategory[];

    @ManyToMany(() => ProductTag)
    @JoinTable()
    tags!: ProductTag[];

    @ManyToOne(() => ProductBrand, { nullable: true })
    brand!: ProductBrand;

    // Variants & Custom Attributes
    @OneToMany(() => ProductVariant, (v) => v.product)
    variants?: ProductVariant[];

    @OneToMany(() => ProductAttributeGroup, (g) => g.product)
    attributeGroups?: ProductAttributeGroup[];

    // Media & Files
    @OneToMany(() => ProductMedia, (m) => m.product)
    media?: ProductMedia[];

    // Pricing
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    basePrice!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    salePrice!: number;

    // Relationships (Upsells/Cross-sells)
    @ManyToMany(() => Product)
    @JoinTable()
    relatedProducts?: Product[];

    @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
    status?: ProductStatus;

    @BeforeInsert()
    addDefaults(){
        this.slug = slugify(this.name)
        this.id = `pdt-${cuid2.createId()}`
    }
}