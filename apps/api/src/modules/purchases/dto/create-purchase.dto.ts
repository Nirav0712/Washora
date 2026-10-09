import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryUnit, PurchaseStatus, PurchasePaymentStatus } from '@washora/shared';

export class PurchaseItemDto {
  @ApiProperty({ example: '66554433221100aabbccdd11', description: 'Inventory Item ID' })
  @IsString()
  @IsNotEmpty()
  inventoryItemId: string;

  @ApiProperty({ example: 10, description: 'Quantity to purchase' })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ example: 45000, description: 'Unit cost in cents/paise' })
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional({ example: 18, description: 'Tax percentage (e.g. 18 for 18%)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  taxRate?: number;
}

export class CreatePurchaseDto {
  @ApiProperty({ example: '66554433221100aabbccdd11', description: 'Branch ID' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: '66554433221100aabbccdd22', description: 'Supplier ID' })
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @ApiPropertyOptional({ example: '2026-10-08' })
  @IsString()
  @IsOptional()
  purchaseDate?: string;

  @ApiProperty({ type: [PurchaseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];

  @ApiPropertyOptional({ example: 0, description: 'Discount in cents/paise' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 'Purchase order for monthly bulk chemicals' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ enum: PurchaseStatus, default: PurchaseStatus.ORDERED })
  @IsEnum(PurchaseStatus)
  @IsOptional()
  status?: PurchaseStatus;
}

export class UpdatePurchaseDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purchaseDate?: string;

  @ApiPropertyOptional({ type: [PurchaseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  @IsOptional()
  items?: PurchaseItemDto[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
