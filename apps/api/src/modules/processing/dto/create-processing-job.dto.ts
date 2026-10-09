import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProcessingPriority } from '@washora/shared';

export class CreateProcessingJobDto {
  @ApiProperty({ example: '66fe48220000000000000001' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: '66fe48220000000000000002' })
  @IsString()
  @IsNotEmpty()
  garmentId: string;

  @ApiPropertyOptional({ example: '66fe48220000000000000003' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ enum: ProcessingPriority, default: ProcessingPriority.NORMAL })
  @IsOptional()
  @IsEnum(ProcessingPriority)
  priority?: ProcessingPriority;

  @ApiPropertyOptional({ example: '66fe48220000000000000004' })
  @IsOptional()
  @IsString()
  assignedUserId?: string;

  @ApiPropertyOptional({ example: 'Wash delicate silk cycle' })
  @IsOptional()
  @IsString()
  notes?: string;
}
