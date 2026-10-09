import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaveTypeDto {
  @ApiProperty({ example: 'Casual Leave' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'CASUAL' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @ApiPropertyOptional({ example: 12, default: 12 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  annualLimit?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}

export class UpdateLeaveTypeDto {
  @ApiPropertyOptional({ example: 'Casual Leave' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  annualLimit?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateLeaveRequestDto {
  @ApiProperty({ example: '66fe48220000000000000001', description: 'Branch ID' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiPropertyOptional({ example: '66fe48220000000000000002', description: 'Staff Profile ID (defaults to current user staff profile)' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiProperty({ example: '66fe48220000000000000003', description: 'Leave Type ID' })
  @IsString()
  @IsNotEmpty()
  leaveTypeId: string;

  @ApiProperty({ example: '2026-10-15', description: 'Start Date in YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2026-10-16', description: 'End Date in YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ example: 2, description: 'Total leave days' })
  @IsNumber()
  @Min(0.5)
  totalDays: number;

  @ApiProperty({ example: 'Family function in hometown' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class RejectLeaveRequestDto {
  @ApiProperty({ example: 'High order volume scheduled during this period' })
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}
