import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiProperty({ example: 100, description: 'Amount to refund' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'Damaged garment refund agreed with customer' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ example: 'REFUND-TXN-1234' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;
}
