import { BeforeInsert, Column, Entity } from "typeorm";
import { Base } from "../base";
import slugify from "@/common/utils/slugify";

@Entity()
export class ProductBrand extends Base {
    @Column({ unique: true })
    name!: string;

    @Column({ unique: true })
    slug!: string;

    @Column({ nullable: true })
    logoUrl?: string;

    @Column({ nullable: true })
    coverImage?: string;

    @Column({ nullable: true })
    website?: string;

    @Column({ nullable: true })
    description?: string;

    // SEO FIELDS
    @Column({ nullable: true })
    metaTitle?: string;

    @Column({ nullable: true })
    metaDescription?: string;

    @Column({ nullable: true })
    metaKeywords?: string;

    @Column({ nullable: true })
    metaImage?: string;

    @BeforeInsert()
    addSlug() {
        this.slug = slugify(this.name)

        if (!this.metaImage && this.logoUrl) {
            this.metaImage = this.logoUrl
        }

        if (!this.metaTitle) {
            this.metaTitle = this.name
        }

        if (!this.metaDescription && this.description) {
            this.metaDescription = this.description
        }
    }
}