import { CarDocument } from '@/common/entities';
import { Service } from 'typedi';
import { Repository } from 'typeorm';

@Service()
export class CarDocumentRepository extends Repository<CarDocument> {}
