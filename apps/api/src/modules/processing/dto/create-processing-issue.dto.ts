import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProcessingIssueSeverity } from '@washora/shared';

export class CreateProcessingIssueDto {
  @ApiProperty({ example: 'STAIN_NOT_REMOVED' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({
    enum: ProcessingIssueSeverity,
    default: ProcessingIssueSeverity.MEDIUM,
  })
  @IsOptional()
  @IsEnum(ProcessingIssueSeverity)
  severity?: ProcessingIssueSeverity;

  @ApiProperty({ example: 'Stubborn oil stain on right shoulder did not come out after wash.' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class ResolveProcessingIssueDto {
  @ApiProperty({ example: 'Re-treated with enzyme spotter and successfully removed.' })
  @IsString()
  @IsNotEmpty()
  resolutionNotes: string;
}
