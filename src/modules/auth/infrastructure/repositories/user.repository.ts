import { User } from '@/common/entities';
import { Service } from 'typedi';
import { Repository } from 'typeorm';

@Service()
export class UserRepository extends Repository<User> {}
