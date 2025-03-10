import { CarModelTranslation } from '@/common/entities';
import { Service } from 'typedi';
import { Repository } from 'typeorm';

@Service()
export class ModelTranslationsRepository extends Repository<CarModelTranslation> { }

