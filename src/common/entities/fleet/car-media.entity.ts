import { Entity, Column, ManyToOne } from 'typeorm';
import { Base } from '../base';
import { Car } from '..';
import { MediaType } from '@/common/enums';

@Entity()
export class CarMedia extends Base {
  @Column()
  url!: string;

  @Column({
    type: 'enum',
    enum: [
      MediaType.AUDIO,
      MediaType.VIDEO,
      MediaType.IMAGE,
      MediaType.MODEL_3D,
    ],
  })
  type!: Omit<MediaType, 'DOCUMENT' | 'PDF' | 'OTHER'>;

  @Column({ default: false })
  isThumbnail!: boolean;

  @Column({ nullable: true })
  title?: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column()
  position!: number; // how to show on screen

  @ManyToOne(() => Car, { onDelete: 'CASCADE' })
  car!: Car;
}
