import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GarmentCondition, GarmentProcessingStatus, ProcessingStage } from '@washora/shared';

export class CreateGarmentDto {
  @ApiProperty({ example: '654321098765432109876543', description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ example: '654321098765432109876542', description: 'Service ID' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ example: 'Silk Shirt' })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({ example: 'Dry Cleaning' })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({ example: 'Topwear' })
  @IsOptional()
  @IsString()
  garmentType?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ example: 'Navy Blue' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'Zara' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ enum: GarmentCondition, default: GarmentCondition.GOOD })
  @IsOptional()
  @IsEnum(GarmentCondition)
  condition?: GarmentCondition;

  @ApiPropertyOptional({ example: 'Small oil mark on left cuff' })
  @IsOptional()
  @IsString()
  conditionNotes?: string;

  @ApiPropertyOptional({ type: [String], example: ['Oil stain on cuff'] })
  @IsOptional()
  @IsArray()
  stainsNoted?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Missing collar button'] })
  @IsOptional()
  @IsArray()
  damagesNoted?: string[];

  @ApiPropertyOptional({ example: 'Do not use bleach' })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional({ example: 'Rack-A4' })
  @IsOptional()
  @IsString()
  shelfLocation?: string;
}
