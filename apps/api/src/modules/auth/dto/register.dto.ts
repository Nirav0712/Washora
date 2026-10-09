import { IsString, IsEmail, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessType } from '@washora/shared';

export class RegisterDto {
  @ApiProperty({ example: 'Rahul Sharma', description: 'Full name of the business owner' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'rahul@cleanwave.in', description: 'Owner email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Washora@2026', description: 'Password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'CleanWave Laundry & Dry Cleaners', description: 'Laundry business name' })
  @IsString()
  tenantName: string;

  @ApiPropertyOptional({ enum: BusinessType, default: BusinessType.LAUNDRY })
  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @ApiPropertyOptional({ example: 'Indiranagar Flagship', description: 'Default main branch name' })
  @IsOptional()
  @IsString()
  branchName?: string;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  branchCity?: string;

  @ApiPropertyOptional({ example: '29ABCDE1234F1Z5', description: 'GSTIN Number' })
  @IsOptional()
  @IsString()
  gstNumber?: string;

  @ApiPropertyOptional({ example: 'PARTNER-BLR-01', description: 'Partner / Referral Code' })
  @IsOptional()
  @IsString()
  partnerCode?: string;
}
