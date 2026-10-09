import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User, UserSchema } from '../../schemas/user.schema';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema';
import { Membership, MembershipSchema } from '../../schemas/membership.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { Role, RoleSchema } from '../../schemas/role.schema';
import { Category, CategorySchema } from '../../schemas/category.schema';
import { Service, ServiceSchema } from '../../schemas/service.schema';
import { SubscriptionPlan, SubscriptionPlanSchema } from '../../schemas/subscription-plan.schema';
import { TenantSubscription, TenantSubscriptionSchema } from '../../schemas/tenant-subscription.schema';
import { RolesModule } from '../roles/roles.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('jwt.accessSecret') ||
          configService.get<string>('JWT_ACCESS_SECRET') ||
          'washora_access_token_secret_key_prod_2026_x89q',
        signOptions: {
          expiresIn:
            configService.get<string>('jwt.accessExpiresIn') ||
            configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
            '15m',
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: Membership.name, schema: MembershipSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Service.name, schema: ServiceSchema },
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: TenantSubscription.name, schema: TenantSubscriptionSchema },
    ]),
    RolesModule,
    SettingsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
