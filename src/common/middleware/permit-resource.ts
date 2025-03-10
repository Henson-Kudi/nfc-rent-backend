import { NextFunction, Request, Response } from 'express';
import { ResourceAction, ResponseCodes, RoleType } from '../enums';
import Container from 'typedi';
import { PermissionService } from '@/modules/auth/application/services/permission.service';
import { AppError } from '../utils';
import slugify from '../utils/slugify';

export function hasPermission(
  path: string,
  action: ResourceAction,
  options?: {
    allowedRoles?: Array<RoleType>;
  }
) {
  return async (req: Request, _: Response, next: NextFunction) => {
    try {
      const permissionService = Container.get(PermissionService);
      const user = req.user;

      if (!user)
        throw new AppError({
          statusCode: ResponseCodes.Forbidden,
          message: 'Unauthorised',
        });

      if (user.roles?.some((r) => r.slug === slugify(RoleType.SUPER_ADMIN))) {
        return next();
      }

      // Check allowed roles shortcut
      if (options?.allowedRoles) {
        const hasAllowedRole = user.roles?.some((r) =>
          options.allowedRoles?.map((r) => slugify(r))?.includes(r.slug)
        );
        if (hasAllowedRole) return next();
      }

      const hasAccess = await permissionService.checkAccess(user, path, action);

      if (!hasAccess) {
        throw new AppError({
          statusCode: ResponseCodes.Forbidden,
          message: `Required permission: ${path}.${action}`,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
