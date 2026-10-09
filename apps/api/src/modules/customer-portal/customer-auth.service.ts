import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { CustomerAccount, CustomerAccountDocument } from '../../schemas/customer-account.schema';
import { Customer, CustomerDocument } from '../../schemas/customer.schema';
import { Tenant, TenantDocument } from '../../schemas/tenant.schema';
import { AuditService } from '../audit/audit.service';
import { CustomerAccountStatus } from '@washora/shared';
import { RequestOtpDto, VerifyOtpDto } from './dto/customer-auth.dto';

@Injectable()
export class CustomerAuthService {
  private readonly logger = new Logger(CustomerAuthService.name);

  constructor(
    @InjectModel(CustomerAccount.name)
    private accountModel: Model<CustomerAccountDocument>,
    @InjectModel(Customer.name)
    private customerModel: Model<CustomerDocument>,
    @InjectModel(Tenant.name)
    private tenantModel: Model<TenantDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  private cleanPhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  async requestOtp(dto: RequestOtpDto) {
    const rawPhone = dto.phone.trim();
    const phone = this.cleanPhone(rawPhone);
    const phoneDigits = phone.replace(/\D/g, '');

    // Resolve tenant
    let tenantId = dto.tenantId;
    let customer: CustomerDocument | null = null;

    if (tenantId && Types.ObjectId.isValid(tenantId)) {
      customer = await this.customerModel.findOne({
        tenantId: new Types.ObjectId(tenantId),
        $or: [
          { phone },
          { phone: phoneDigits },
          { phone: `+${phoneDigits}` },
          { phone: { $regex: new RegExp(`${phoneDigits.slice(-10)}$`) } },
        ],
        isDeleted: { $ne: true },
      }).exec();
    } else {
      customer = await this.customerModel.findOne({
        $or: [
          { phone },
          { phone: phoneDigits },
          { phone: `+${phoneDigits}` },
          { phone: { $regex: new RegExp(`${phoneDigits.slice(-10)}$`) } },
        ],
        isDeleted: { $ne: true },
      }).exec();

      if (customer) {
        tenantId = customer.tenantId.toString();
      }
    }

    if (!customer || !tenantId) {
      // Auto-provision or register customer in first active tenant if none exists in dev
      const defaultTenant = await this.tenantModel.findOne().exec();
      if (!defaultTenant) {
        throw new NotFoundException('No active laundry store found.');
      }
      tenantId = defaultTenant._id.toString();

      customer = new this.customerModel({
        tenantId: defaultTenant._id,
        name: 'Valued Customer',
        phone: rawPhone,
        totalOrders: 0,
        totalSpent: 0,
        pendingBalance: 0,
        addresses: [],
      });
      await customer.save();
    }

    const tId = new Types.ObjectId(tenantId);

    // Find or create CustomerAccount
    let account = await this.accountModel.findOne({
      tenantId: tId,
      customerId: customer._id,
    }).exec();

    if (!account) {
      account = new this.accountModel({
        tenantId: tId,
        customerId: customer._id,
        phone: customer.phone || phone,
        email: customer.email,
        isPhoneVerified: false,
        status: CustomerAccountStatus.ACTIVE,
      });
    }

    if (account.status === CustomerAccountStatus.SUSPENDED) {
      throw new ForbiddenException('Your customer account is suspended. Please contact the store.');
    }

    // Generate 6-digit OTP (e.g. 123456 or random)
    const isTestEnv = process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;
    const otp = isTestEnv ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();

    account.otpCodeHash = this.hashOtp(otp);
    account.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await account.save();

    await this.auditService.log({
      tenantId,
      action: 'CUSTOMER_ACCOUNT_OTP_REQUESTED',
      entity: 'CustomerAccount',
      entityId: account._id.toString(),
      metadata: { phone: account.phone, customerId: customer._id.toString() },
    });

    return {
      success: true,
      message: 'OTP sent to mobile number',
      tenantId,
      expiresInSeconds: 600,
      testOtp: isTestEnv ? '123456' : undefined,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const rawPhone = dto.phone.trim();
    const phone = this.cleanPhone(rawPhone);
    const phoneDigits = phone.replace(/\D/g, '');

    const accountFilter: Record<string, any> = {
      $or: [
        { phone },
        { phone: phoneDigits },
        { phone: `+${phoneDigits}` },
        { phone: { $regex: new RegExp(`${phoneDigits.slice(-10)}$`) } },
      ],
    };

    if (dto.tenantId && Types.ObjectId.isValid(dto.tenantId)) {
      accountFilter.tenantId = new Types.ObjectId(dto.tenantId);
    }

    const account = await this.accountModel.findOne(accountFilter).exec();

    if (!account) {
      throw new UnauthorizedException('Customer account not found for this phone number.');
    }

    if (account.status === CustomerAccountStatus.SUSPENDED) {
      throw new ForbiddenException('Your customer account has been suspended.');
    }

    if (!account.otpExpiresAt || account.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('OTP has expired. Please request a new one.');
    }

    const hashedInput = this.hashOtp(dto.otp.trim());
    if (account.otpCodeHash !== hashedInput) {
      throw new UnauthorizedException('Invalid OTP code.');
    }

    // Mark verified and clear OTP
    account.isPhoneVerified = true;
    account.otpCodeHash = undefined;
    account.otpExpiresAt = undefined;
    account.lastLoginAt = new Date();

    const customer = await this.customerModel.findById(account.customerId).exec();
    const tenant = await this.tenantModel.findById(account.tenantId).exec();

    // Generate Customer JWT
    const secret = this.configService.get<string>('JWT_SECRET', 'washora_dev_jwt_secret_2026_super_secure');
    const tokenPayload = {
      isCustomer: true,
      customerAccountId: account._id.toString(),
      customerId: account.customerId.toString(),
      tenantId: account.tenantId.toString(),
      phone: account.phone,
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      secret,
      expiresIn: '30d',
    });

    if (!account.sessionTokens) account.sessionTokens = [];
    account.sessionTokens.push(accessToken);
    if (account.sessionTokens.length > 10) {
      account.sessionTokens = account.sessionTokens.slice(-10);
    }
    await account.save();

    await this.auditService.log({
      tenantId: account.tenantId.toString(),
      action: 'CUSTOMER_ACCOUNT_VERIFIED',
      entity: 'CustomerAccount',
      entityId: account._id.toString(),
      metadata: { phone: account.phone, customerId: account.customerId.toString() },
    });

    return {
      accessToken,
      account: {
        id: account._id.toString(),
        customerId: account.customerId.toString(),
        tenantId: account.tenantId.toString(),
        phone: account.phone,
        email: account.email,
        isPhoneVerified: account.isPhoneVerified,
        status: account.status,
      },
      customer: customer ? {
        id: customer._id.toString(),
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        customerCode: customer.customerCode,
        pendingBalance: customer.pendingBalance || 0,
      } : null,
      tenant: tenant ? {
        id: tenant._id.toString(),
        name: tenant.name,
        logo: tenant.logo,
      } : null,
    };
  }

  async logout(customerAccountId: string, token?: string) {
    const account = await this.accountModel.findById(customerAccountId).exec();
    if (account && token) {
      account.sessionTokens = (account.sessionTokens || []).filter((t) => t !== token);
      await account.save();
    }

    if (account) {
      await this.auditService.log({
        tenantId: account.tenantId.toString(),
        action: 'CUSTOMER_ACCOUNT_LOGOUT',
        entity: 'CustomerAccount',
        entityId: account._id.toString(),
      });
    }

    return { success: true, message: 'Logged out successfully' };
  }

  async getMe(customerAccountId: string) {
    const account = await this.accountModel.findById(customerAccountId).exec();
    if (!account) {
      throw new NotFoundException('Customer account not found');
    }

    const customer = await this.customerModel.findById(account.customerId).exec();
    const tenant = await this.tenantModel.findById(account.tenantId).exec();

    return {
      account: {
        id: account._id.toString(),
        customerId: account.customerId.toString(),
        tenantId: account.tenantId.toString(),
        phone: account.phone,
        email: account.email,
        isPhoneVerified: account.isPhoneVerified,
        status: account.status,
      },
      customer: customer ? {
        id: customer._id.toString(),
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        customerCode: customer.customerCode,
        pendingBalance: customer.pendingBalance || 0,
        totalOrders: customer.totalOrders || 0,
        totalSpent: customer.totalSpent || 0,
        addresses: customer.addresses || [],
      } : null,
      tenant: tenant ? {
        id: tenant._id.toString(),
        name: tenant.name,
        logo: tenant.logo,
        phone: tenant.phone,
        email: tenant.email,
      } : null,
    };
  }
}
