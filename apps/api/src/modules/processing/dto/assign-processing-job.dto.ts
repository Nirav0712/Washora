import {
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProcessingPriority } from '@washora/shared';

export class AssignProcessingJobDto {
  @ApiPropertyOptional({ example: '66fe48220000000000000001', description: 'User ID of operator (or null to unassign)' })
  @IsOptional()
  @IsString()
  assignedUserId?: string;

  @ApiPropertyOptional({ example: 'Assigned to ironing specialist' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProcessingPriorityDto {
  @ApiProperty({ enum: ProcessingPriority, example: ProcessingPriority.HIGH })
  @IsEnum(ProcessingPriority)
  priority: ProcessingPriority;

  @ApiPropertyOptional({ example: 'VIP Customer request rush order' })
  @IsOptional()
  @IsString()
  reason?: string;
}
