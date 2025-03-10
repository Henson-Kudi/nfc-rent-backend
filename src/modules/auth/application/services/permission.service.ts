import { Inject, Service } from 'typedi';
import { PermissionRepository } from '../../infrastructure/repositories/permission.repository';
import { Repository } from 'typeorm';
import { User } from '@/common/entities';
import { ResourceAction, RoleType } from '@/common/enums';
import slugify from '@/common/utils/slugify';
import { ResourceRepository } from '../../infrastructure/repositories/resource.repository';

@Service()
export class PermissionService {
  constructor(
    @Inject() private userRepository: Repository<User>,
    @Inject() private permissionRepo: PermissionRepository,
    @Inject() private resourceRepo: ResourceRepository
  ) {}

  async checkAccess(
    user: User,
    path: string,
    action: ResourceAction
  ): Promise<boolean> {
    // 1. Super Admin bypass
    if (user.roles.some((r) => r.slug === slugify(RoleType.SUPER_ADMIN))) {
      return true;
    }

    // 2. Role-based restrictions
    if (user.roles.some((r) => r.slug === slugify(RoleType.VIEWER))) {
      if (action !== ResourceAction.READ || path.startsWith('system'))
        return false;
    }

    if (user.roles.some((r) => r.slug === slugify(RoleType.EDITOR))) {
      if (path.startsWith('system') && action !== ResourceAction.READ)
        return false;
    }

    // 3. Check cached permissions
    const requiredPermission = `${path}.${action}`;
    if (user.cachedPermissions?.includes(requiredPermission)) {
      return true;
    }

    // 4. Check direct permissions
    const hasDirectAccess = await this.permissionRepo.userHasAccess(
      user.id,
      requiredPermission
    );

    if (hasDirectAccess) return true;

    // 5. Check wildcard permissions
    const allPermissions = await this.permissionRepo.getUserPermissions(
      user.id
    );

    if (this.checkWildcardAccess(allPermissions, path, action)) {
      return true;
    }

    // 6. Check hierarchical permissions
    if (await this.checkHierarchicalAccess(user.id, path)) {
      return true;
    }

    return false;
  }

  private checkWildcardAccess(
    permissions: string[],
    path: string,
    action: string
  ): boolean {
    return permissions.some((permission) => {
      const [permPath, permAction] = this.splitPermissionIdentifier(permission);

      // Match path segments with wildcards
      const pathMatch = this.matchPath(permPath, path);

      // Match action with MANAGE override
      const actionMatch =
        permAction === ResourceAction.MANAGE || permAction === action;

      return pathMatch && actionMatch;
    });
  }

  private async checkHierarchicalAccess(
    userId: string,
    path: string
  ): Promise<boolean> {
    const pathSegments = path.split('.');

    while (pathSegments.length > 0) {
      pathSegments.pop();
      const parentPath = pathSegments.join('.');

      // Check both exact and wildcard parent permissions
      const hasAccess =
        (await this.permissionRepo.userHasAccess(
          userId,
          `${parentPath}.${ResourceAction.MANAGE}`
        )) ||
        (await this.permissionRepo.userHasAccess(
          userId,
          `${parentPath}.*.${ResourceAction.MANAGE}`
        ));

      if (hasAccess) return true;
    }

    return false;
  }

  private splitPermissionIdentifier(identifier: string): [string, string] {
    const lastDotIndex = identifier.lastIndexOf('.');
    return [
      identifier.slice(0, lastDotIndex),
      identifier.slice(lastDotIndex + 1),
    ];
  }

  private matchPath(permPath: string, reqPath: string): boolean {
    const permParts = permPath.split('.');
    const reqParts = reqPath.split('.');

    if (permParts.length !== reqParts.length) return false;

    return permParts.every(
      (part, index) => part === '*' || part === reqParts[index]
    );
  }

  async refreshUserCache(userId: string): Promise<void> {
    const permissions = await this.permissionRepo.getUserPermissions(userId);
    await this.userRepository.update(userId, {
      cachedPermissions: permissions,
    });
  }
}
