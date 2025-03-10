import { Base } from '../base';
import { User } from '..';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class OTP extends Base {
  @Column()
  userId!: string;

  @ManyToOne(() => User, (user) => user.otps)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  token!: string;

  @Column({ default: 1 })
  count!: number;

  @Column()
  expireAt!: Date;
}
