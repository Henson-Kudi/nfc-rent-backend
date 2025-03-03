import { BeforeInsert, Column, Entity } from "typeorm";
import { Base } from "../base";
import slugify from "@/common/utils/slugify";

@Entity()
export class ProductTag extends Base {
    @Column({ unique: true })
    name!: string;
    @Column({ unique: true })
    slug!: string;

    @BeforeInsert()
    addTagSlug() {
        this.slug = slugify(this.name)
    }
}