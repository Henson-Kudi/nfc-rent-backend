import { Column, Entity, OneToMany, Tree, TreeChildren, TreeParent, } from "typeorm";
import { Base } from "../base";
import { Permission } from '..'

@Entity()
@Tree('materialized-path')
export class Resource extends Base {
    @Column()
    name!: string;

    @Column({ unique: true })
    path!: string;

    @TreeParent()
    parent!: Resource;

    @TreeChildren()
    children!: Resource[];

    @OneToMany(() => Permission, permission => permission.resource)
    permissions!: Permission[];
}