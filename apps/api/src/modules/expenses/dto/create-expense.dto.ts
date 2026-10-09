import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpensePaymentMethod } from '@washora/shared';

export class CreateExpenseDto {
  @ApiPropertyOptional({ example: '66fe48220000000000000001', description: 'Branch ID' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty({ example: '66fe48220000000000000002', description: 'Expense Category ID' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Boiler Electric Coil Replacement' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Replaced faulty heating coil for Main Plant Steam Boiler' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 450000, description: 'Amount in paise/cents (450000 = ₹4,500)' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: '2026-10-08', description: 'Expense Date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @ApiPropertyOptional({ enum: ExpensePaymentMethod, default: ExpensePaymentMethod.CASH })
  @IsOptional()
  @IsEnum(ExpensePaymentMethod)
  paymentMethod?: ExpensePaymentMethod;

  @ApiPropertyOptional({ example: '66fe48220000000000000003', description: 'Supplier ID' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({ example: 'https://cdn.washora.com/receipts/rec-123.pdf' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional({ example: 'INV-2026-992' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ example: 'Urgent weekend repair' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateExpenseDto {
  @ApiPropertyOptional({ example: '66fe48220000000000000001' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: '66fe48220000000000000002' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Updated Expense Title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({ example: '2026-10-08' })
  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @ApiPropertyOptional({ enum: ExpensePaymentMethod })
  @IsOptional()
  @IsEnum(ExpensePaymentMethod)
  paymentMethod?: ExpensePaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectExpenseDto {
  @ApiProperty({ example: 'Invoice amount mismatch with physical voucher' })
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}

export class PayExpenseDto {
  @ApiPropertyOptional({ enum: ExpensePaymentMethod, default: ExpensePaymentMethod.CASH })
  @IsOptional()
  @IsEnum(ExpensePaymentMethod)
  paymentMethod?: ExpensePaymentMethod;

  @ApiPropertyOptional({ example: 'UPI-REF-9928374' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ example: 'Payment executed by branch accountant' })
  @IsOptional()
  @IsString()
  notes?: string;
}
