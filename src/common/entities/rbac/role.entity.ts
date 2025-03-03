import { Column, Entity, ManyToMany, ManyToOne, JoinTable, BeforeInsert, BeforeUpdate } from "typeorm";
import { Base } from "../base";
import { Permission, User } from "..";
import slugify from "@/common/utils/slugify";

@Entity()
export class Role extends Base {
    @Column({ unique: true })
    name!: string;

    @Column({ unique: true })
    slug!: string;

    @ManyToMany(() => Permission, permission => permission.roles)
    @JoinTable()
    permissions!: Permission[];

    @ManyToMany(() => User, user => user.roles, { onDelete: 'CASCADE' })
    users!: User[];

    @BeforeInsert()
    @BeforeUpdate()
    setSlug() {
        this.slug = slugify(this.name)
    }
}