import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum, MinLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlatformAdminRole, PlatformPermission } from '@washora/shared';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@washora.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Admin@12345' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class CreateAdminUserDto {
  @ApiProperty({ example: 'support@washora.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Support Admin' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Admin@12345' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ enum: PlatformAdminRole, example: PlatformAdminRole.SUPPORT_ADMIN })
  @IsEnum(PlatformAdminRole)
  role: PlatformAdminRole;

  @ApiPropertyOptional({ type: [String], example: ['platform.dashboard.view'] })
  @IsOptional()
  @IsArray()
  permissions?: PlatformPermission[];
}

export class UpdateAdminProfileDto {
  @ApiPropertyOptional({ example: 'Support Lead' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'OldPass@123' })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiPropertyOptional({ example: 'NewPass@123' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  newPassword?: string;
}
