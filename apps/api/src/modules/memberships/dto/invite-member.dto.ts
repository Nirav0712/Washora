import { IsString, IsEmail, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '@washora/shared';

export class InviteMemberDto {
  @ApiProperty({ example: 'Suresh Kumar' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'suresh@cleanwave.in' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+919123456780' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: RoleType, example: RoleType.CASHIER })
  @IsEnum(RoleType)
  roleCode: RoleType;

  @ApiPropertyOptional({ type: [String], description: 'Assigned branch IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  branchIds?: string[];
}
