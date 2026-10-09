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

export class PayPurchaseDto {
  @ApiProperty({ example: 100000, description: 'Amount to pay towards this purchase order in cents/paise' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: ExpensePaymentMethod, example: ExpensePaymentMethod.BANK_TRANSFER })
  @IsEnum(ExpensePaymentMethod)
  @IsNotEmpty()
  paymentMethod: ExpensePaymentMethod;

  @ApiPropertyOptional({ example: 'TXN-998822' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ example: '2026-10-08' })
  @IsString()
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional({ example: 'Partial payment on PO delivery' })
  @IsString()
  @IsOptional()
  notes?: string;
}
