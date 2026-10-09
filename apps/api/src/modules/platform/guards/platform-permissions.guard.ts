import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformPermission, PlatformAdminRole } from '@washora/shared';
import { PLATFORM_PERMISSIONS_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PlatformPermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PlatformPermission[]>(
      PLATFORM_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { admin } = context.switchToHttp().getRequest();

    if (!admin) {
      throw new ForbiddenException('Platform administrator context not found');
    }

    // SUPER_ADMIN has full platform privileges
    if (admin.role === PlatformAdminRole.SUPER_ADMIN) {
      return true;
    }

    const hasPermission = requiredPermissions.every((perm) =>
      admin.permissions?.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient platform privileges. Required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
