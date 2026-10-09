import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpensePaymentMethod } from '@washora/shared';

export class RecordSupplierPaymentDto {
  @ApiProperty({ example: '66554433221100aabbccddee', description: 'Supplier ID' })
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @ApiPropertyOptional({ example: '66554433221100aabbccdd11', description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ example: 150000, description: 'Payment amount in cents/paise' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: ExpensePaymentMethod, example: ExpensePaymentMethod.BANK_TRANSFER })
  @IsEnum(ExpensePaymentMethod)
  @IsNotEmpty()
  paymentMethod: ExpensePaymentMethod;

  @ApiPropertyOptional({ example: 'NEFT-88392189' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ example: '2026-10-08' })
  @IsString()
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional({ example: '66554433221100aabbccdd22', description: 'Purchase ID if linked' })
  @IsString()
  @IsOptional()
  purchaseId?: string;

  @ApiPropertyOptional({ example: 'Payment towards Invoice INV-9002' })
  @IsString()
  @IsOptional()
  notes?: string;
}
