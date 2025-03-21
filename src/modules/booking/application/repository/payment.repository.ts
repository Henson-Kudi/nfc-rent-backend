import { Payment } from '@/common/entities';
import { Service } from 'typedi';
import { Repository } from 'typeorm';

@Service()
export class PaymentRepository extends Repository<Payment> {}
