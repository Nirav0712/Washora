import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnitType } from '@washora/shared';

export class ProductPriceDto {
  @ApiProperty({ example: 60, description: 'Standard/Regular service price in INR' })
  @IsNumber()
  @Min(0)
  regular: number;

  @ApiProperty({ example: 90, description: 'Express tier price in INR' })
  @IsNumber()
  @Min(0)
  express: number;

  @ApiProperty({ example: 120, description: 'Same-day urgent tier price in INR' })
  @IsNumber()
  @Min(0)
  sameDay: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  urgent?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  custom?: number;
}

export class BranchPriceOverrideDto {
  @ApiProperty({ example: '66fe48220000000000000001' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ type: ProductPriceDto })
  @ValidateNested()
  @Type(() => ProductPriceDto)
  prices: ProductPriceDto;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Men Formal Shirt' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '66fe48220000000000000002', description: 'Category ObjectId' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional({ example: 'SHIRT-M-01', description: 'Unique SKU per tenant' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 'Cotton, linen, and poly-blend formal shirts' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 'Shirt' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ enum: UnitType, default: UnitType.PIECE })
  @IsEnum(UnitType)
  unit: UnitType;

  @ApiProperty({ type: ProductPriceDto })
  @ValidateNested()
  @Type(() => ProductPriceDto)
  prices: ProductPriceDto;

  @ApiPropertyOptional({ type: [String], description: 'Supported service IDs (e.g. Wash, Dry Clean)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[];

  @ApiPropertyOptional({ type: [BranchPriceOverrideDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BranchPriceOverrideDto)
  branchPriceOverrides?: BranchPriceOverrideDto[];

  @ApiPropertyOptional({ type: [String], description: 'Branches where product is available (empty = all)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  branchAvailability?: string[];

  @ApiPropertyOptional({ example: 5.0, default: 5.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isTaxable?: boolean;

  @ApiPropertyOptional({ example: 24, default: 24 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  processingTimeHours?: number;

  @ApiPropertyOptional({ example: 'Handle with delicate steam iron, avoid bleach' })
  @IsOptional()
  @IsString()
  careInstructions?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
