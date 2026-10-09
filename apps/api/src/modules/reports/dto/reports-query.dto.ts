import { IsOptional, IsEnum, IsString, IsDateString, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { ReportDateRangePreset } from '@washora/shared';

export class ReportFilterDto {
  @ApiPropertyOptional({ enum: ReportDateRangePreset, example: ReportDateRangePreset.THIS_MONTH })
  @IsOptional()
  @IsEnum(ReportDateRangePreset)
  rangePreset?: ReportDateRangePreset;

  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z' })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ example: '65f1234567890abcdef12345' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: '65f1234567890abcdef12346' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: '65f1234567890abcdef12347' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ example: '65f1234567890abcdef12348' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ example: 'UPI' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'COMPLETED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  compare?: boolean;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;
}

export class ExportReportDto extends ReportFilterDto {
  @ApiPropertyOptional({ enum: ['csv', 'excel'], default: 'csv' })
  @IsOptional()
  @IsString()
  format?: string;
}
