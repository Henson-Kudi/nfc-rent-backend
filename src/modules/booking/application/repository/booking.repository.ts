import { AddressMapping, Booking, RentalPricing } from '@/common/entities';
import { Service } from 'typedi';
import { Repository } from 'typeorm';

@Service()
export class BookingRepository extends Repository<Booking> {}

@Service()
export class AddressMappingRepository extends Repository<AddressMapping> {}

@Service()
export class RentalPricingRepository extends Repository<RentalPricing> {}
