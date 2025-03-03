import { DataSource, EntityManager, Like } from "typeorm";
import { ResourceAction, RoleType } from "@/common/enums";
import slugify from "@/common/utils/slugify";
import { RoleRepository } from "@/modules/auth/infrastructure/repositories/role.repository";
import { ResourceRepository } from "@/modules/auth/infrastructure/repositories/resource.repository";
import { PermissionRepository } from "@/modules/auth/infrastructure/repositories/permission.repository";
import Container from "typedi";
import { Permission, Resource, Role } from "@/common/entities";
import logger from "@/common/utils/logger";
import { Modules } from "@/common/utils/resourcePathBuilder";

type SeederContext = {
    dataSource: DataSource;
    resourceRepo: ResourceRepository;
    roleRepo: RoleRepository;
    permissionRepo: PermissionRepository;
};

export async function seedDefaultRoles(dataSource: DataSource) {
    const context: SeederContext = {
        dataSource,
        resourceRepo: Container.get(ResourceRepository),
        roleRepo: Container.get(RoleRepository),
        permissionRepo: Container.get(PermissionRepository)
    };

    await dataSource.transaction(async transactionalEntityManager => {
        const rolesToCreate = [
            createRoleDefinition(RoleType.SUPER_ADMIN, []),
            createRoleDefinition(RoleType.EDITOR, [
                { path: '*', action: ResourceAction.MANAGE },
                { path: 'system.*', action: ResourceAction.READ }
            ]),
            createRoleDefinition(RoleType.VIEWER, [
                { path: '*', action: ResourceAction.READ }
            ]),
            createRoleDefinition('USER', [
                { path: Modules.users.children.user.path, action: ResourceAction.MANAGE }
            ]),
        ];

        for (const roleDef of rolesToCreate) {
            const role = await createRoleEntity(transactionalEntityManager, roleDef);

            if (roleDef.name !== RoleType.SUPER_ADMIN) {
                const permissions = await processRolePermissions(
                    context,
                    transactionalEntityManager,
                    roleDef.permissions
                );
                role.permissions = permissions;
                await transactionalEntityManager.save(role);
            }
        }
    });

    logger.info('Successfully seeded default roles and permissions!');
}

// Helper functions
function createRoleDefinition(
    name: RoleType | string,
    permissions: Array<{ path: string; action: ResourceAction }>
) {
    return {
        name,
        slug: slugify(name),
        permissions
    };
}

async function createRoleEntity(
    manager: EntityManager,
    roleDef: ReturnType<typeof createRoleDefinition>
) {
    const exists = await manager.findOne(Role, { where: { slug: roleDef.slug }})
    if (exists) {
        return exists
    }
    const role = new Role();
    role.name = roleDef.name;
    role.slug = roleDef.slug;
    // role.description = roleDef.description;
    return await manager.save(role);
}

async function processRolePermissions(
    context: SeederContext,
    manager: EntityManager,
    permissions: Array<{ path: string; action: ResourceAction }>
) {
    const result: Permission[] = [];

    for (const permDef of permissions) {
        const modules = await context.resourceRepo.find({
            where: { path: Like(permDef.path.replace('*', '%')) }
        });

        for (const module of modules) {
            const permission = await findOrCreatePermission(
                manager,
                module,
                permDef.action
            );
            result.push(permission);
        }
    }

    return result;
}

async function findOrCreatePermission(
    manager: EntityManager,
    module: Resource,
    action: ResourceAction
) {
    const existing = await manager.findOne(Permission, {
        where: {
            resource: { id: module.id },
            action
        }
    });

    if (existing) return existing;

    const newPerm = new Permission();
    newPerm.action = action;
    newPerm.resource = module;
    newPerm.identifier = `${module.path}.${action}`;
    return manager.save(newPerm);
}