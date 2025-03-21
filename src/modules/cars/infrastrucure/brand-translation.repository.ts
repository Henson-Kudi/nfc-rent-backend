import { CarBrandTranslation } from '@/common/entities';
import { Service } from 'typedi';
import { Repository } from 'typeorm';

@Service()
export class BrandTranslationsRepository extends Repository<CarBrandTranslation> {}
