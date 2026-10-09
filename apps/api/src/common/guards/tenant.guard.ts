import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userPayload = request.user;

    if (!userPayload || !userPayload.tenantId) {
      throw new UnauthorizedException('Tenant context missing from authentication token.');
    }

    // Bind trusted tenantId directly onto request object
    request.tenantId = userPayload.tenantId;
    request.membershipId = userPayload.membershipId;
    request.userRole = userPayload.role;
    request.userPermissions = userPayload.permissions || [];
    request.userBranchIds = userPayload.branchIds || [];

    return true;
  }
}
