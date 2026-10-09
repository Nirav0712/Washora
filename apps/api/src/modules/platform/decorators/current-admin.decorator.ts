import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PlatformAdminRole, PlatformPermission } from '@washora/shared';

export interface CurrentAdminContext {
  adminId: string;
  email: string;
  name: string;
  role: PlatformAdminRole;
  permissions: PlatformPermission[];
  isPlatformAdmin: boolean;
}

export const CurrentAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentAdminContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.admin;
  },
);
