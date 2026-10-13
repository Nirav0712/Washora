import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SupportCategory,
  TicketPriority,
  TicketStatus,
} from '../../../schemas/support-ticket.schema';

export class CreateSupportTicketDto {
  @ApiProperty({ enum: SupportCategory, example: SupportCategory.TECHNICAL })
  @IsEnum(SupportCategory)
  category: SupportCategory;

  @ApiPropertyOptional({ enum: TicketPriority, example: TicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiProperty({ example: 'Thermal tag printer not connecting to Koramangala workstation' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'The POS USB thermal printer times out when attempting to print garment labels.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ type: [String], example: ['https://storage.washora.com/logs/printer-error.png'] })
  @IsOptional()
  @IsArray()
  attachments?: string[];
}

export class AddTicketMessageDto {
  @ApiProperty({ example: 'We verified the printer cable and restarted the service.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  attachments?: string[];
}

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: TicketStatus, example: TicketStatus.RESOLVED })
  @IsEnum(TicketStatus)
  status: TicketStatus;

  @ApiPropertyOptional({ example: 'Driver reinstalled and USB port permissions updated.' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

export class AssignTicketDto {
  @ApiProperty({ example: '66fe48220000000000000009', description: 'Platform Admin / Agent User ID' })
  @IsString()
  @IsNotEmpty()
  assignedTo: string;
}

export class UpdatePlatformContactSettingsDto {
  @ApiPropertyOptional({ example: '+91 80 4680 1100' })
  @IsOptional()
  @IsString()
  serviceSupportNumber?: string;

  @ApiPropertyOptional({ example: '+91 80 4680 1101' })
  @IsOptional()
  @IsString()
  salesNumber?: string;

  @ApiPropertyOptional({ example: '+91 99000 88221' })
  @IsOptional()
  @IsString()
  companyConnectNumber?: string;

  @ApiPropertyOptional({ example: 'support@washora.com' })
  @IsOptional()
  @IsString()
  supportEmail?: string;

  @ApiPropertyOptional({ example: 'sales@washora.com' })
  @IsOptional()
  @IsString()
  salesEmail?: string;

  @ApiPropertyOptional({ example: '+91 99000 88221' })
  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @ApiPropertyOptional({ example: 'Monday - Saturday: 8:00 AM - 9:00 PM IST' })
  @IsOptional()
  @IsString()
  businessHours?: string;
}
