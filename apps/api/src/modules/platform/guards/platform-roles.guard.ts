import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformAdminRole } from '@washora/shared';
import { PLATFORM_ROLES_KEY } from '../decorators/require-roles.decorator';

@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<PlatformAdminRole[]>(
      PLATFORM_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { admin } = context.switchToHttp().getRequest();

    if (!admin) {
      throw new ForbiddenException('Platform administrator context not found');
    }

    // SUPER_ADMIN has access to all role-restricted platform routes
    if (admin.role === PlatformAdminRole.SUPER_ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.includes(admin.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access restricted to platform roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
