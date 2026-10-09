import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryUnit } from '@washora/shared';

export class CreateInventoryItemDto {
  @ApiPropertyOptional({ example: '66554433221100aabbccdd11', description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ example: '66554433221100aabbccdd01', description: 'Inventory Category ID' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Eco Super Detergent 5L' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Concentrated liquid laundry detergent' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: InventoryUnit, example: InventoryUnit.LITER })
  @IsEnum(InventoryUnit)
  @IsNotEmpty()
  unit: InventoryUnit;

  @ApiPropertyOptional({ example: 50, description: 'Initial stock quantity' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  initialStock?: number;

  @ApiPropertyOptional({ example: 10, description: 'Minimum stock alert threshold' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minimumStock?: number;

  @ApiPropertyOptional({ example: 15, description: 'Reorder level' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  reorderLevel?: number;

  @ApiPropertyOptional({ example: 45000, description: 'Initial/unit cost in cents/paise' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateInventoryItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: InventoryUnit })
  @IsEnum(InventoryUnit)
  @IsOptional()
  unit?: InventoryUnit;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  minimumStock?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  reorderLevel?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
