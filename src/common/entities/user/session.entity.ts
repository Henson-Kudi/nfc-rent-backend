import { Base } from '../base';
import { User } from '..';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

@Entity()
@Unique('UQ_UserSession_userId_device', ['userId', 'device'])
export class Session extends Base {
  @Column()
  userId!: string;

  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  refreshToken!: string;

  @Column()
  device!: string;

  @Column()
  location!: string;

  @Column()
  expiresAt!: Date;

  @Column({ nullable: true })
  loggedOutAt?: Date;

  @Column()
  lastActiveAt!: Date;
}
