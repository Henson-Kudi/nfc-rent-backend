import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, OneToMany, Unique } from "typeorm";
import { Base } from "../base";
import { Product } from '..'
import slugify from "@/common/utils/slugify";
import cuid2 from "@paralleldrive/cuid2";

@Entity()
export class ProductAttributeGroup extends Base {

    @Column({ unique: true })
    name!: string; //ex: Size, Color, Trim, Memory Capacity, Processor Speed, etc

    @Column({ unique: true })
    slug!: string;

    @ManyToOne(() => Product, (product) => product.attributeGroups)
    product!: Product;

    @OneToMany(() => ProductAttributeOption, (option) => option.group)
    options!: ProductAttributeOption[];

    @BeforeInsert()
    addSlug() {
        this.slug = slugify(this.name)
    }
}

@Entity()
@Unique("UQ_ProductAttributeOption_Label_Group", ["label", "groupId"]) // We want to ensure that no group has 2 options with the same names (either in lower or upper case)
export class ProductAttributeOption extends Base {

    @Column()
    label!: string; // Red (in case of color), L (in case of Size), 4GB in  case Memory. Combined with groupId, all records must be unique

    @Column()
    groupId!: string; // need to explicitly pass the groupId in order to capture the foreign key for uniqueness.

    @Column({ nullable: true })
    value?: string; // #000(color), 30*40 or null(size), null

    @Column({ nullable: true })
    imageUrl?: string;

    @ManyToOne(() => ProductAttributeGroup, (group) => group.options)
    group!: ProductAttributeGroup;

    @BeforeInsert()
    setDefaults() {
        this.id = cuid2.createId()
        this.label = slugify(this.label, { replacement: ' ' }) // convert label to lowercase. replace all special characters with a single space. so we can track uniqueness of items
    }

    @BeforeUpdate()
    updateFields() {
        if (this.label) {
            this.label = slugify(this.label, { replacement: ' ' }) // if label is being updated, make sure it maintains the same pattern
        }
    }
}