import { BeforeInsert, Column, Entity, ManyToOne } from "typeorm";
import { Base } from "../base";
import slugify from "@/common/utils/slugify";

@Entity()
export class ProductCategory extends Base {

    @Column()
    name!: string;

    @Column({ unique: true })
    slug!: string;

    @Column({ nullable: true })
    image?: string;

    @ManyToOne(() => ProductCategory, { nullable: true })
    parent?: ProductCategory;

    @Column({ nullable: true })
    description?: string;

    @BeforeInsert()
    addSlug() {
        this.slug = slugify(this.name)
    }
}