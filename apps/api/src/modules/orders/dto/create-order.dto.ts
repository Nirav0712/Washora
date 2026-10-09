import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PricingTier,
  DiscountType,
  PaymentMethod,
  GarmentCondition,
} from '@washora/shared';

export class OrderGarmentInputDto {
  @ApiPropertyOptional({ example: 'Blue' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'Raymond' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ enum: GarmentCondition, default: GarmentCondition.GOOD })
  @IsOptional()
  @IsEnum(GarmentCondition)
  condition?: GarmentCondition;

  @ApiPropertyOptional({ type: [String], example: ['Coffee mark on collar'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stainsNoted?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Loose top button'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  damagesNoted?: string[];

  @ApiPropertyOptional({ example: 'Steam iron only' })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

export class OrderItemInputDto {
  @ApiProperty({ example: '66fe48220000000000000001' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ example: '66fe48220000000000000002' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ enum: PricingTier, default: PricingTier.REGULAR })
  @IsOptional()
  @IsEnum(PricingTier)
  pricingTier?: PricingTier;

  @ApiProperty({ example: 2, default: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'Gentle wash' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Navy Blue' })
  @IsOptional()
  @IsString()
  garmentColor?: string;

  @ApiPropertyOptional({ example: 'Zara' })
  @IsOptional()
  @IsString()
  garmentBrand?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  lineSubtotal?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  lineTotal?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defectsNoted?: string[];

  @ApiPropertyOptional({ type: [OrderGarmentInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderGarmentInputDto)
  garments?: OrderGarmentInputDto[];
}

export class OrderDiscountInputDto {
  @ApiPropertyOptional({ enum: DiscountType, default: DiscountType.AMOUNT })
  @IsOptional()
  @IsEnum(DiscountType)
  type?: DiscountType;

  @ApiPropertyOptional({ example: 50, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;
}

export class InitialPaymentInputDto {
  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ example: 'UPI-REF-981273918' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ example: 'Received at counter' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: '66fe48220000000000000003' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: '66fe48220000000000000004' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiPropertyOptional({ enum: PricingTier, default: PricingTier.REGULAR })
  @IsOptional()
  @IsEnum(PricingTier)
  pricingTier?: PricingTier;

  @ApiProperty({ type: [OrderItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @ApiPropertyOptional({ type: OrderDiscountInputDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderDiscountInputDto)
  discount?: OrderDiscountInputDto;

  @ApiPropertyOptional({ type: InitialPaymentInputDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InitialPaymentInputDto)
  payment?: InitialPaymentInputDto;

  @ApiPropertyOptional({ example: 'Express customer collection' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  pickupRequired?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  deliveryRequired?: boolean;

  @ApiPropertyOptional({ example: '2026-10-10T18:00:00.000Z' })
  @IsOptional()
  @IsString()
  expectedReadyAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  grandTotal?: number;
}
