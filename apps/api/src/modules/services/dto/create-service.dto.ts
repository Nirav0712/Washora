import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Dry Cleaning' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'DRY_CLEAN' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'Eco-friendly solvent dry cleaning with fabric conditioner' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1.5, default: 1.0 })
  @IsOptional()
  @IsNumber()
  multiplier?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
