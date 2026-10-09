import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformAuthService } from '../services/platform-auth.service';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformRolesGuard } from '../guards/platform-roles.guard';
import { PlatformPermissionsGuard } from '../guards/platform-permissions.guard';
import { CurrentAdmin, CurrentAdminContext } from '../decorators/current-admin.decorator';
import { RequirePlatformRoles } from '../decorators/require-roles.decorator';
import { RequirePlatformPermission } from '../decorators/require-permission.decorator';
import { PlatformAdminRole, PlatformPermission } from '@washora/shared';
import {
  AdminLoginDto,
  CreateAdminUserDto,
  UpdateAdminProfileDto,
} from '../dto/platform-auth.dto';

@ApiTags('Platform Auth')
@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private authService: PlatformAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Platform administrator login' })
  async login(@Body() dto: AdminLoginDto, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.login(dto, ip, ua);
  }

  @Get('me')
  @UseGuards(PlatformAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated platform administrator profile' })
  async getMe(@CurrentAdmin() admin: CurrentAdminContext) {
    return this.authService.getMe(admin.adminId);
  }

  @Patch('me')
  @UseGuards(PlatformAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current platform administrator profile or password' })
  async updateMe(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Body() dto: UpdateAdminProfileDto,
  ) {
    return this.authService.updateMe(admin.adminId, dto);
  }

  @Post('users')
  @UseGuards(PlatformAuthGuard, PlatformRolesGuard)
  @RequirePlatformRoles(PlatformAdminRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new platform administrator user (Super Admin only)' })
  async createAdminUser(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Body() dto: CreateAdminUserDto,
  ) {
    return this.authService.createAdmin(admin.adminId, dto);
  }

  @Get('users')
  @UseGuards(PlatformAuthGuard, PlatformRolesGuard)
  @RequirePlatformRoles(PlatformAdminRole.SUPER_ADMIN, PlatformAdminRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List platform administrator users' })
  async listAdminUsers() {
    return this.authService.listAdmins();
  }

  @Patch('users/:id/status')
  @UseGuards(PlatformAuthGuard, PlatformRolesGuard)
  @RequirePlatformRoles(PlatformAdminRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate or deactivate a platform administrator account' })
  async setAdminStatus(
    @CurrentAdmin() admin: CurrentAdminContext,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.authService.setAdminStatus(id, !!isActive, admin.adminId);
  }
}
