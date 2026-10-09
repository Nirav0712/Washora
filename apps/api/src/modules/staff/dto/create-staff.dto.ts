import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsObject,
  ValidateNested,
  IsNumber,
  Min,
  IsEmail,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType, StaffStatus, SalaryType, RoleType } from '@washora/shared';

export class EmergencyContactDto {
  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Spouse' })
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class AddressDto {
  @ApiPropertyOptional({ example: '42 MG Road' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ example: 'Ahmedabad' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Gujarat' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '380001' })
  @IsOptional()
  @IsString()
  pincode?: string;
}

export class BankDetailsDto {
  @ApiPropertyOptional({ example: '123456789012' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'HDFC0001234' })
  @IsOptional()
  @IsString()
  ifscCode?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: 'Rahul Sharma' })
  @IsOptional()
  @IsString()
  accountHolderName?: string;

  @ApiPropertyOptional({ example: 'rahul@oksbi' })
  @IsOptional()
  @IsString()
  upiId?: string;
}

export class AllowanceDeductionDto {
  @ApiProperty({ example: 'House Rent Allowance' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 200000, description: 'Amount in paise' })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class SalaryConfigurationDto {
  @ApiProperty({ enum: SalaryType, example: SalaryType.MONTHLY })
  @IsEnum(SalaryType)
  salaryType: SalaryType;

  @ApiProperty({ example: 2500000, description: 'Base salary in paise (e.g. 2500000 = 25,000 INR)' })
  @IsNumber()
  @Min(0)
  baseSalary: number;

  @ApiPropertyOptional({ example: 15000, description: 'Hourly rate in paise' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ example: 20000, description: 'Overtime rate per hour in paise' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeRate?: number;

  @ApiPropertyOptional({ type: [AllowanceDeductionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllowanceDeductionDto)
  allowances?: AllowanceDeductionDto[];

  @ApiPropertyOptional({ type: [AllowanceDeductionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllowanceDeductionDto)
  deductions?: AllowanceDeductionDto[];

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}

export class CreateStaffDto {
  @ApiPropertyOptional({ description: 'Existing user ID to attach profile to' })
  @IsOptional()
  @IsString()
  userId?: string;

  // Fields for new user creation if userId not provided
  @ApiPropertyOptional({ example: 'Rahul Sharma' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'rahul.operator@washora.test' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: RoleType, example: RoleType.OPERATOR })
  @IsOptional()
  @IsEnum(RoleType)
  roleCode?: RoleType;

  @ApiPropertyOptional({ example: 'Washora@2026' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @ApiProperty({ enum: EmploymentType, example: EmploymentType.FULL_TIME })
  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @ApiPropertyOptional({ example: 'Senior Washing Specialist' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: 'Plant Operations' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ example: '66fe48220000000000000001', description: 'Primary branch ID' })
  @IsString()
  @IsNotEmpty()
  primaryBranchId: string;

  @ApiPropertyOptional({ type: [String], example: ['66fe48220000000000000001'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  branchIds?: string[];

  @ApiPropertyOptional({ example: '1995-05-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ type: EmergencyContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ type: BankDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @ApiPropertyOptional({ example: 'ABCDE1234F' })
  @IsOptional()
  @IsString()
  governmentId?: string;

  @ApiPropertyOptional({ type: SalaryConfigurationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryConfigurationDto)
  salaryConfiguration?: SalaryConfigurationDto;

  @ApiPropertyOptional({ example: 'Experienced dry cleaning operator' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateStaffDto {
  @ApiPropertyOptional({ enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ example: 'Lead Plant Supervisor' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: 'Plant Operations' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: '66fe48220000000000000001' })
  @IsOptional()
  @IsString()
  primaryBranchId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  branchIds?: string[];

  @ApiPropertyOptional({ type: EmergencyContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ type: BankDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @ApiPropertyOptional({ example: 'ABCDE1234F' })
  @IsOptional()
  @IsString()
  governmentId?: string;

  @ApiPropertyOptional({ type: SalaryConfigurationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryConfigurationDto)
  salaryConfiguration?: SalaryConfigurationDto;

  @ApiPropertyOptional({ enum: StaffStatus })
  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
