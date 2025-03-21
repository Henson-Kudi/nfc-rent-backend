import { CarMedia } from '@/common/entities';
import { Service } from 'typedi';
import { Repository } from 'typeorm';

@Service()
export class CarMediaRepository extends Repository<CarMedia> {}
