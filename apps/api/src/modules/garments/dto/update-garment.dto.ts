import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GarmentCondition, GarmentProcessingStatus, ProcessingStage } from '@washora/shared';

export class UpdateGarmentDto {
  @ApiPropertyOptional({ example: 'Navy Blue' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'Zara' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ enum: GarmentCondition })
  @IsOptional()
  @IsEnum(GarmentCondition)
  condition?: GarmentCondition;

  @ApiPropertyOptional({ example: 'Small oil mark on left cuff' })
  @IsOptional()
  @IsString()
  conditionNotes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  stainsNoted?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  damagesNoted?: string[];

  @ApiPropertyOptional({ example: 'Do not use bleach' })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional({ enum: GarmentProcessingStatus })
  @IsOptional()
  @IsEnum(GarmentProcessingStatus)
  processingStatus?: GarmentProcessingStatus;

  @ApiPropertyOptional({ enum: ProcessingStage })
  @IsOptional()
  @IsEnum(ProcessingStage)
  stage?: ProcessingStage;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isQCApproved?: boolean;

  @ApiPropertyOptional({ example: 'Rack-B2' })
  @IsOptional()
  @IsString()
  shelfLocation?: string;
}
