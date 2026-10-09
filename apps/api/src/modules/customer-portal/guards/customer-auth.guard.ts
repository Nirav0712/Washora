import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomerAccount, CustomerAccountDocument } from '../../../schemas/customer-account.schema';
import { CustomerAccountStatus } from '@washora/shared';

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(CustomerAccount.name)
    private accountModel: Model<CustomerAccountDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Customer authorization token missing');
    }

    const token = authHeader.split(' ')[1];

    try {
      const secret = this.configService.get<string>('JWT_SECRET', 'washora_dev_jwt_secret_2026_super_secure');
      const payload = this.jwtService.verify(token, { secret });

      if (!payload.isCustomer || !payload.customerAccountId || !payload.customerId || !payload.tenantId) {
        throw new UnauthorizedException('Invalid customer portal token');
      }

      // Verify account active status and session validity in database
      const account = await this.accountModel.findOne({
        _id: new Types.ObjectId(payload.customerAccountId),
        tenantId: new Types.ObjectId(payload.tenantId),
      }).exec();

      if (!account) {
        throw new UnauthorizedException('Customer account not found');
      }

      if (account.status === CustomerAccountStatus.SUSPENDED) {
        throw new ForbiddenException('Your customer account has been suspended. Please contact support.');
      }

      if (account.sessionTokens && account.sessionTokens.length > 0 && !account.sessionTokens.includes(token)) {
        throw new UnauthorizedException('Session expired or logged out. Please sign in again.');
      }

      // Attach resolved customer context to request
      request.customer = {
        accountId: account._id.toString(),
        customerId: account.customerId.toString(),
        tenantId: account.tenantId.toString(),
        phone: account.phone,
        email: account.email,
        status: account.status,
        token,
      };

      request.customerId = account.customerId.toString();
      request.tenantId = account.tenantId.toString();

      return true;
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired customer session token');
    }
  }
}
