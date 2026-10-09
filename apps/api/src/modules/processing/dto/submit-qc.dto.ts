import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QCResult, QCIssueType } from '@washora/shared';

export class SubmitQCDto {
  @ApiProperty({ enum: QCResult, example: QCResult.PASSED })
  @IsEnum(QCResult)
  result: QCResult;

  @ApiPropertyOptional({
    type: [String],
    enum: QCIssueType,
    example: [QCIssueType.STAIN_REMAINING],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  issues?: QCIssueType[];

  @ApiPropertyOptional({ example: 'Minor wrinkle left on cuff - passed with note' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isOverride?: boolean;

  @ApiPropertyOptional({ example: 'Manager approved minor stain release waiver' })
  @IsOptional()
  @IsString()
  overrideReason?: string;

  @ApiPropertyOptional({
    example: 'IRONING',
    description: 'Stage to route back to when result is REWORK_REQUIRED',
  })
  @IsOptional()
  @IsString()
  reworkStageCode?: string;
}
