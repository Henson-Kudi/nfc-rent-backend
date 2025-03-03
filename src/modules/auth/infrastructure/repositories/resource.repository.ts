import { Permission, Resource } from "@/common/entities";
import { Service } from "typedi";
import { TreeRepository } from "typeorm";

@Service()
export class ResourceRepository extends TreeRepository<Resource> {
    async findSubtreePermissions(path: string): Promise<Permission[]> {
        return this.manager
            .createQueryBuilder(Permission, 'permission')
            .innerJoin('permission.resource', 'module')
            .where('module.path LIKE :path', { path: `${path}%` })
            .getMany();
    }
}