import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus, AttendanceSource } from '@washora/shared';

export class CheckInDto {
  @ApiProperty({ example: '66fe48220000000000000001', description: 'Branch ID where checking in' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiPropertyOptional({ example: 'Morning shift start' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: AttendanceSource, default: AttendanceSource.WEB })
  @IsOptional()
  @IsEnum(AttendanceSource)
  source?: AttendanceSource;
}

export class CheckOutDto {
  @ApiPropertyOptional({ example: 'End of shift work complete' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CorrectAttendanceDto {
  @ApiPropertyOptional({ example: '2026-10-08T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  checkInAt?: string;

  @ApiPropertyOptional({ example: '2026-10-08T18:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  checkOutAt?: string;

  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ example: 480, description: 'Work minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  workMinutes?: number;

  @ApiPropertyOptional({ example: 60, description: 'Overtime minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeMinutes?: number;

  @ApiProperty({ example: 'Forgot to check out due to urgent order rush' })
  @IsString()
  @IsNotEmpty()
  correctionReason: string;

  @ApiPropertyOptional({ example: 'Approved by branch manager' })
  @IsOptional()
  @IsString()
  notes?: string;
}
