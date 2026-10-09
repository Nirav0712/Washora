import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'rahul@cleanwave.in' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Washora@2026' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: 'cleanwave-laundry', description: 'Optional specific tenant slug' })
  @IsOptional()
  @IsString()
  tenantSlug?: string;

  @ApiPropertyOptional({ description: 'Optional specific tenant ID' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
