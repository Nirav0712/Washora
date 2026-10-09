import { SetMetadata } from '@nestjs/common';
import { PlatformPermission } from '@washora/shared';

export const PLATFORM_PERMISSIONS_KEY = 'platform_permissions';
export const RequirePlatformPermission = (...permissions: PlatformPermission[]) =>
  SetMetadata(PLATFORM_PERMISSIONS_KEY, permissions);
