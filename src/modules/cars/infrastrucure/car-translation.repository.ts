import { CarTranslation } from '@/common/entities';
import { Service } from 'typedi';
import { Repository } from 'typeorm';

@Service()
export class CarTranslationsRepository extends Repository<CarTranslation> {}
