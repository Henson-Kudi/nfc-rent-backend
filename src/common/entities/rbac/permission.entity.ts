import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { Base } from '../base';
import { Resource, Role } from '..';
import { ResourceAction } from '@/common/enums';

@Entity()
export class Permission extends Base {
  @Column({
    type: 'enum',
    enum: ResourceAction,
  })
  action!: string;

  @ManyToOne(() => Resource)
  resource!: Resource;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles!: Role[];

  @BeforeInsert()
  @BeforeUpdate()
  setIdentifier() {
    this.identifier = `${this.resource.path}.${this.action}`;
  }

  @Column({ unique: true })
  identifier!: string;
}
