import { CarFeatureTranslation } from '@/common/entities';
import { Service } from 'typedi';
import { Repository } from 'typeorm';

@Service()
export class FeatureTranslationsRepository extends Repository<CarFeatureTranslation> {}
