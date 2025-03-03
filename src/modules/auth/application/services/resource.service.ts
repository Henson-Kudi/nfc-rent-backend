import { Inject, Service } from "typedi";
import { ResourceRepository } from "../../infrastructure/repositories/resource.repository";
import { Resource } from "@/common/entities";
import { AppError } from "@/common/utils";
import { ResponseCodes } from "@/common/enums";

// Resource Module Service
@Service()
export class ResourceService {
    constructor(
        @Inject() private moduleRepo: ResourceRepository
    ) { }

    async createModule(name: string, parentPath?: string): Promise<Resource> {
        const module = new Resource();
        module.name = name;

        if (parentPath) {
            const parent = await this.moduleRepo.findOne({ where: { path: parentPath } });
            if (!parent) throw new AppError({
                message: 'Parent module not found',
                statusCode: ResponseCodes.BadRequest,
            });
            module.parent = parent;
            module.path = `${parentPath}.${name}`;
        } else {
            module.path = name;
        }

        return this.moduleRepo.save(module);
    }

    async getModuleTree(): Promise<Resource[]> {
        return this.moduleRepo.findTrees();
    }
}