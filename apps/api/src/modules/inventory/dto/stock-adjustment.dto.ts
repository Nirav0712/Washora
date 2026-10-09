import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockMovementType } from '@washora/shared';

export class StockAdjustmentDto {
  @ApiProperty({ example: '66554433221100aabbccdd11', description: 'Inventory Item ID' })
  @IsString()
  @IsNotEmpty()
  inventoryItemId: string;

  @ApiProperty({ enum: StockMovementType, example: StockMovementType.MANUAL_ADJUSTMENT })
  @IsEnum(StockMovementType)
  @IsNotEmpty()
  type: StockMovementType;

  @ApiProperty({ example: 5, description: 'Quantity change (positive to add, negative to deduct)' })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiPropertyOptional({ example: 45000, description: 'Unit cost in cents/paise (if adding stock)' })
  @IsNumber()
  @IsOptional()
  unitCost?: number;

  @ApiPropertyOptional({ example: 'PHYSICAL_COUNT', description: 'Reference type' })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @ApiPropertyOptional({ example: 'COUNT-2026-10-08', description: 'Reference ID' })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiPropertyOptional({ example: 'Stock audit count correction' })
  @IsString()
  @IsOptional()
  reason?: string;
}
