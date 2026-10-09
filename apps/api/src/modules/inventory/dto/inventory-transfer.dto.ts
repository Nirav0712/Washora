import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestInventoryTransferDto {
  @ApiProperty({ example: '66554433221100aabbccdd11', description: 'Source branch ID' })
  @IsString()
  @IsNotEmpty()
  fromBranchId: string;

  @ApiProperty({ example: '66554433221100aabbccdd22', description: 'Destination branch ID' })
  @IsString()
  @IsNotEmpty()
  toBranchId: string;

  @ApiProperty({ example: '66554433221100aabbccdd33', description: 'Inventory Item ID' })
  @IsString()
  @IsNotEmpty()
  inventoryItemId: string;

  @ApiProperty({ example: 10, description: 'Quantity to transfer' })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional({ example: 'Emergency stock transfer for weekend rush' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CompleteInventoryTransferDto {
  @ApiPropertyOptional({ example: 'Transfer verified and received by branch manager' })
  @IsString()
  @IsOptional()
  notes?: string;
}
