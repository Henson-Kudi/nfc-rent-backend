import { Driver } from "@/common/entities";
import { Service } from "typedi";
import { Repository } from "typeorm";

@Service()
export class DriverRepository extends Repository<Driver> { }