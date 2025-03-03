import { Column, Entity, ManyToOne, OneToMany, JoinColumn, BeforeInsert, BeforeUpdate, Index } from "typeorm";
import { TranslationEntity } from "../translation-base";
import { Base } from "../base";
import { CarModel } from "..";
import slugify from "@/common/utils/slugify";

@Entity()
@Index(['createdAt'])
@Index(['slug'])
@Index(['isActive'])
export class CarBrand extends Base {
    // Non-translatable fields
    @Column({ unique: true }) //(e.g., "toyota") (English name of the brand.)
    code!: string;

    @Column({ unique: true })
    slug!: string;

    @Column({ nullable: true })
    logo?: string

    @Column({ nullable: true })
    coverImage?: string

    // Translations (one-to-many)
    @OneToMany(() => CarBrandTranslation, trans => trans.parent)
    translations!: CarBrandTranslation[];

    // Models under this brand (one-to-many)
    @OneToMany(() => CarModel, model => model.brand)
    models!: CarModel[];

    @BeforeInsert()
    @BeforeUpdate()
    slugifyCode() {
        slugify(this.code)
    }
}

@Entity()
@Index(['parentId'])
@Index(['name'], { fulltext: true })
@Index(['parentId', 'locale', 'name'])
export class CarBrandTranslation extends TranslationEntity<CarBrand> {
    @ManyToOne(() => CarBrand, brand => brand.translations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parentId' })
    parent!: CarBrand;

    @Column({})
    name!: string

    @Column({ nullable: true })
    shortDescription?: string

    @Column({ nullable: true })
    description?: string

    @Column({ nullable: true })
    metaTitle?: string

    @Column({ nullable: true })
    metaDescription?: string

    @Column({ nullable: true })
    metaTags?: string
}