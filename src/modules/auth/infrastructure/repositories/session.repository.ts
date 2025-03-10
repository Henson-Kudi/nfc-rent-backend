import { Session } from '@/common/entities';
import { Service } from 'typedi';
import { Repository } from 'typeorm';

@Service()
export class SessionRepository extends Repository<Session> {}
