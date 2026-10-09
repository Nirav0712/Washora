import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessType, TenantStatus } from '@washora/shared';

export class ProvisionTenantDto {
  @ApiProperty({ example: 'CleanWave Laundry Hub' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiPropertyOptional({ example: 'cleanwave' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'Rajesh Kumar' })
  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @ApiProperty({ example: 'rajesh@cleanwave.com' })
  @IsEmail()
  @IsNotEmpty()
  ownerEmail: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  ownerPhone: string;

  @ApiPropertyOptional({ example: 'TempPass@123' })
  @IsOptional()
  @IsString()
  ownerPassword?: string;

  @ApiPropertyOptional({ enum: BusinessType, example: BusinessType.LAUNDRY })
  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @ApiPropertyOptional({ example: '100 Feet Road, Indiranagar' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Indiranagar Flagship' })
  @IsOptional()
  @IsString()
  primaryBranchName?: string;

  @ApiPropertyOptional({ example: '65f1234567890abcdef12345' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  trialDays?: number;
}

export class UpdateTenantAdminDto {
  @ApiPropertyOptional({ example: 'CleanWave Premium Laundry' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'support@cleanwave.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '100 Feet Road, Indiranagar, Bangalore' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '29ABCDE1234F1Z5' })
  @IsOptional()
  @IsString()
  gstNumber?: string;

  @ApiPropertyOptional({ enum: TenantStatus })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}

export class TenantLifecycleActionDto {
  @ApiProperty({ example: 'Account activated following KYC document verification' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
