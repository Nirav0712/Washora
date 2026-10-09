import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SalaryType } from '@washora/shared';
import { AllowanceDeductionDto } from './create-staff.dto';

export class CreateSalaryRecordDto {
  @ApiPropertyOptional({ example: '66fe48220000000000000001', description: 'Staff Profile ID' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiProperty({ enum: SalaryType, example: SalaryType.MONTHLY })
  @IsEnum(SalaryType)
  salaryType: SalaryType;

  @ApiProperty({ example: 3000000, description: 'Base salary in paise (e.g. 3000000 = ₹30,000)' })
  @IsNumber()
  @Min(0)
  baseSalary: number;

  @ApiPropertyOptional({ example: 15000, description: 'Hourly rate in paise' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ example: 25000, description: 'Overtime rate per hour in paise' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeRate?: number;

  @ApiPropertyOptional({ type: [AllowanceDeductionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllowanceDeductionDto)
  allowances?: AllowanceDeductionDto[];

  @ApiPropertyOptional({ type: [AllowanceDeductionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllowanceDeductionDto)
  deductions?: AllowanceDeductionDto[];

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}

export class CreatePayrollPeriodDto {
  @ApiProperty({ example: 'October 2026' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '2026-10-01', description: 'Start date in YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2026-10-31', description: 'End date in YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  endDate: string;
}

export class CreateSalaryAdvanceDto {
  @ApiProperty({ example: '66fe48220000000000000001', description: 'Staff Profile ID' })
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @ApiProperty({ example: 500000, description: 'Advance amount in paise (e.g. 500000 = ₹5,000)' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: '2026-10-08', description: 'Requested date YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  requestedDate?: string;

  @ApiProperty({ example: 'Medical emergency advance' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ApproveSalaryAdvanceDto {
  @ApiPropertyOptional({ example: '66fe48220000000000000002', description: 'Payroll Period ID to deduct advance from' })
  @IsOptional()
  @IsString()
  deductFromPayrollPeriodId?: string;
}

export class RejectSalaryAdvanceDto {
  @ApiProperty({ example: 'Exceeds monthly advance threshold limit' })
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}
