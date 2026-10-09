import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerAuthService } from './customer-auth.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/customer-auth.dto';
import { CustomerAuthGuard } from './guards/customer-auth.guard';
import { CurrentCustomer, CurrentCustomerContext } from './decorators/current-customer.decorator';

@ApiTags('Customer Auth')
@Controller('customer-auth')
export class CustomerAuthController {
  constructor(private readonly authService: CustomerAuthService) {}

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request 6-digit OTP for customer phone authentication' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and obtain customer portal session access token' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('logout')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate current customer session token' })
  async logout(
    @CurrentCustomer() customer: CurrentCustomerContext,
  ) {
    return this.authService.logout(customer.accountId, customer.token);
  }

  @Get('me')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated customer profile and session metadata' })
  async getMe(@CurrentCustomer() customer: CurrentCustomerContext) {
    return this.authService.getMe(customer.accountId);
  }
}
