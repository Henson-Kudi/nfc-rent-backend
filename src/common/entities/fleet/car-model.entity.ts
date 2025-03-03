import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { TranslationEntity } from "../translation-base";
import { Base } from "../base";
import { CarBrand } from "..";

@Entity()
export class CarModel extends Base {

    @Column({ unique: true })
    code!: string; // Non-translatable identifier (e.g., "camry")

    @Column({ unique: true })
    slug!: string; // slugified code

    @ManyToOne(() => CarBrand, brand => brand.models, {onDelete: 'CASCADE'})
    brand!: CarBrand;

    @OneToMany(() => CarModelTranslation, trans => trans.parent)
    translations!: CarModelTranslation[];
}

@Entity()
export class CarModelTranslation extends TranslationEntity<CarModel> {
    @Column()
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

    @ManyToOne(() => CarModel, model => model.translations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parentId' })
    parent!: CarModel;
}