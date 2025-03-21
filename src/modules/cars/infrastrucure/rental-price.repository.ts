import { RentalPricing } from '@/common/entities';
import { Service } from 'typedi';
import { Repository } from 'typeorm';

@Service()
export class RentalPriceRepository extends Repository<RentalPricing> {}
