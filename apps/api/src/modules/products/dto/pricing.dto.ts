import { ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductPriceDto, BranchPriceOverrideDto } from './create-product.dto';

export class UpdateProductPricingDto {
  @ApiProperty({ type: ProductPriceDto })
  @ValidateNested()
  @Type(() => ProductPriceDto)
  prices: ProductPriceDto;
}

export class UpdateBranchPriceOverridesDto {
  @ApiProperty({ type: [BranchPriceOverrideDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BranchPriceOverrideDto)
  branchPriceOverrides: BranchPriceOverrideDto[];
}
