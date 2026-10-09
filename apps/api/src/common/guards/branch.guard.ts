import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RoleType } from '@washora/shared';

@Injectable()
export class BranchGuard implements CanActivate {
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

    if (!userPayload) {
      return true; // Let AuthGuard handle missing user
    }

    // Shop Owners and Super Admins have access to all branches
    if (userPayload.role === RoleType.SHOP_OWNER || userPayload.role === RoleType.SUPER_ADMIN) {
      return true;
    }

    // Extract target branchId from request (param, query, header, or body)
    const targetBranchId =
      request.params?.branchId ||
      request.query?.branchId ||
      request.headers?.['x-branch-id'] ||
      (request.body && typeof request.body === 'object' ? request.body.branchId : null);

    if (!targetBranchId) {
      // If no specific branch is being targeted, proceed
      return true;
    }

    const assignedBranches: string[] = (userPayload.branchIds || []).map((id: any) => id.toString());

    // If assignedBranches is empty for non-owners, or if targetBranch is not in assigned branches
    if (assignedBranches.length > 0 && !assignedBranches.includes(targetBranchId.toString())) {
      throw new ForbiddenException(`You do not have access to branch ${targetBranchId}.`);
    }

    return true;
  }
}
