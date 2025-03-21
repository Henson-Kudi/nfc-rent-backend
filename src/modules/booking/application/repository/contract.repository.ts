import { Contract, ContractVoilation } from '@/common/entities';
import { Service } from 'typedi';
import { Repository } from 'typeorm';

@Service()
export class ContractRepository extends Repository<Contract> {}

@Service()
export class ContractViolationRepository extends Repository<ContractVoilation> {}
