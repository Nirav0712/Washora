import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProcessingStageDto {
  @ApiProperty({ example: 'WASHING' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Washing / Dry Cleaning' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Industrial wash or solvent cycle' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 3, default: 1 })
  @IsNumber()
  @Min(1)
  sequence: number;

  @ApiPropertyOptional({ example: '#0ea5e9' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'Droplets' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '66fe48220000000000000001' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProcessingStageDto {
  @ApiPropertyOptional({ example: 'WASHING' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'Eco Washing' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  sequence?: number;

  @ApiPropertyOptional({ example: '#0ea5e9' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'Droplets' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
