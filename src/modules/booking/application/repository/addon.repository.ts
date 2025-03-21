import { Addon } from '@/common/entities';
import { Service } from 'typedi';
import { Repository } from 'typeorm';

@Service()
export class AddonRepository extends Repository<Addon> {}
