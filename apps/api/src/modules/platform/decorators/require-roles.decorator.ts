import { SetMetadata } from '@nestjs/common';
import { PlatformAdminRole } from '@washora/shared';

export const PLATFORM_ROLES_KEY = 'platform_roles';
export const RequirePlatformRoles = (...roles: PlatformAdminRole[]) =>
  SetMetadata(PLATFORM_ROLES_KEY, roles);
