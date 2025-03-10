import { Inject, Service } from 'typedi';
import { Role, User } from '@/common/entities';
import { RoleRepository } from '../../infrastructure/repositories/role.repository';
import { PermissionRepository } from '../../infrastructure/repositories/permission.repository';
import { In, Repository } from 'typeorm';
import slugify from '@/common/utils/slugify';
import { AppError } from '@/common/utils';
import { ResponseCodes } from '@/common/enums';
import { UserRepository } from '../../infrastructure/repositories/user.repository';

// RBAC Service
@Service()
export class RoleService {
  constructor(
    @Inject() private roleRepo: RoleRepository,
    @Inject() private userRepo: UserRepository,
    @Inject() private permissionRepo: PermissionRepository
  ) {}

  async createRole(
    name: string,
    permissionIdentifiers: string[]
  ): Promise<Role> {
    const permissions = await this.permissionRepo.findBy({
      id: In(permissionIdentifiers),
    });

    const role = new Role();
    role.name = name;
    role.permissions = permissions;

    return this.roleRepo.save(role);
  }

  async assignRole(user: User, roleName: string): Promise<User> {
    const role = await this.roleRepo.findOne({
      where: { slug: slugify(roleName) },
    });
    if (!role)
      throw new AppError({
        message: 'Role not found',
        statusCode: ResponseCodes.BadRequest,
      });

    user.roles = [...(user.roles || []), role];
    return this.userRepo.save(user);
  }
}
