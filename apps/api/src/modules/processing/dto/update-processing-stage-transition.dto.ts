import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProcessingStageTransitionDto {
  @ApiProperty({ example: 'WASHING' })
  @IsString()
  @IsNotEmpty()
  stageCode: string;

  @ApiPropertyOptional({ example: 'Started washing cycle' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isOverride?: boolean;

  @ApiPropertyOptional({ example: 'Manager approved fast-track' })
  @IsOptional()
  @IsString()
  overrideReason?: string;
}
