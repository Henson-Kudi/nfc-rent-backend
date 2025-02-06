import { Entity, PrimaryColumn, Column, BeforeInsert } from 'typeorm';
import cuid from '@paralleldrive/cuid2'; // or 'cuid'
import slugify from '@/common/utils/slugify';

@Entity()
export class Shop {
    @PrimaryColumn()
    id!: string;

    @Column({ unique: true, })
    name!: string;

    @Column({ unique: true, })
    slug?: string;

    @BeforeInsert()
    generateDefaultRequiredFields() {
        if (!this.id) {
            this.id = `shop-${cuid.createId()}`;
        }

        if (!this.slug) {
            this.slug = slugify(this.name)
        }
    }
}
