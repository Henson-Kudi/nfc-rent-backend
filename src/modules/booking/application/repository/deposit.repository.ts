import { AddressMapping } from "@/common/entities";
import { Service } from "typedi";
import { Repository } from "typeorm";

@Service()
export class DepositsRepository extends Repository<AddressMapping> { }