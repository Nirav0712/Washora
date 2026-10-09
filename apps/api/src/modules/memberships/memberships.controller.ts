import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembershipsService } from './memberships.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard, TenantGuard, PermissionsGuard } from '../../common/guards';
import { RequirePermissions } from '../../common/decorators';
import { PermissionCode } from '@washora/shared';

@ApiTags('Memberships & Team')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all members of the current tenant' })
  @RequirePermissions(PermissionCode.USER_VIEW)
  async getMembers(@Req() req: any) {
    return this.membershipsService.findAllByTenant(req.tenantId);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new team member with role and branch assignments' })
  @RequirePermissions(PermissionCode.USER_INVITE)
  async inviteMember(@Req() req: any, @Body() dto: InviteMemberDto) {
    return this.membershipsService.inviteMember(req.tenantId, req.user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update member role or branch assignments' })
  @RequirePermissions(PermissionCode.USER_UPDATE)
  async updateMember(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membershipsService.updateMember(req.tenantId, id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate / suspend a team membership' })
  @RequirePermissions(PermissionCode.USER_REMOVE)
  async removeMember(@Req() req: any, @Param('id') id: string) {
    return this.membershipsService.removeMember(req.tenantId, id, req.user.userId);
  }
}
