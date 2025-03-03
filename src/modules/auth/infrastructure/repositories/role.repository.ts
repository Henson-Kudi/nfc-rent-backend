import { Role } from "@/common/entities";
import { Service } from "typedi";
import { Repository } from "typeorm";

@Service()
export class RoleRepository extends Repository<Role>{
    
}