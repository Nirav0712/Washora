import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsDateString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShiftDto {
  @ApiProperty({ example: 'Morning Shift' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'MORNING' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: '09:00', description: '24-hour format HH:mm' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @ApiProperty({ example: '18:00', description: '24-hour format HH:mm' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @ApiPropertyOptional({ example: 60, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  breakMinutes?: number;

  @ApiPropertyOptional({ example: 15, default: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  graceMinutes?: number;

  @ApiPropertyOptional({ example: 480, default: 480 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  workingMinutes?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isOvernight?: boolean;

  @ApiPropertyOptional({ example: '66fe48220000000000000001' })
  @IsOptional()
  @IsString()
  branchId?: string;
}

export class UpdateShiftDto {
  @ApiPropertyOptional({ example: 'Morning Shift' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime?: string;

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime?: string;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  breakMinutes?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  graceMinutes?: number;

  @ApiPropertyOptional({ example: 480 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  workingMinutes?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isOvernight?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignShiftDto {
  @ApiProperty({ example: '66fe48220000000000000001', description: 'Branch ID' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: '66fe48220000000000000002', description: 'Staff Profile ID' })
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @ApiProperty({ example: '66fe48220000000000000003', description: 'Shift Definition ID' })
  @IsString()
  @IsNotEmpty()
  shiftId: string;

  @ApiProperty({ example: '2026-10-08', description: 'Date in YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Day of week 0-6' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;
}
