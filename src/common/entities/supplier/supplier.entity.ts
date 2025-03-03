import { BeforeInsert, Column, Entity } from "typeorm";
import { Base } from "../base";
import slugify from "@/common/utils/slugify";

@Entity()
export class Supplier extends Base {

    @Column()
    name!: string;

    @Column({ unique: true })
    slug!: string;

    @Column({ type: 'int', default: 7 }) //lead time defaults to 7 days
    leadTimeDays!: number;

    @BeforeInsert()
    addSlug() {
        this.slug = slugify(this.name)
    }
}