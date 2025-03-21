import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { TranslationEntity } from '../translation-base';
import { Base } from '../base';
import { Car } from '..';
import { FeatureCategory } from '@/common/enums';

@Entity()
export class CarFeature extends Base {
  @Column({ unique: true })
  code!: string;

  @Column({ unique: true })
  slug!: string; // slugified code

  @Column({
    type: 'enum',
    enum: FeatureCategory,
  })
  category!: FeatureCategory;

  @Column({ default: false })
  isHighlighted!: boolean;

  @OneToMany(() => CarFeatureTranslation, (trans) => trans.parent)
  translations!: CarFeatureTranslation[];

  @ManyToMany(() => Car, (car) => car.features)
  cars!: Car[];
}

@Entity()
export class CarFeatureTranslation extends TranslationEntity<CarFeature> {
  @Column()
  name!: string;

  @Column({ nullable: true })
  shortDescription?: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => CarFeature, (feature) => feature.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  parent!: CarFeature;
}
