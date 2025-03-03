import { Column } from "typeorm";
import { Base } from "./base";

export abstract class TranslationEntity<T> extends Base {

    @Column()
    locale!: string;


    abstract parent: T;

    @Column()
    parentId!: string; // Matches the parent entity's ID (e.g., CarBrand.id)
}