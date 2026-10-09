import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Schemas
import { PlatformAdmin, PlatformAdminSchema } from '../../schemas/platform-admin.schema';
import { Partner, PartnerSchema } from '../../schemas/partner.schema';
import { SubscriptionPlan, SubscriptionPlanSchema } from '../../schemas/subscription-plan.schema';
import { TenantSubscription, TenantSubscriptionDocument, TenantSubscriptionSchema } from '../../schemas/tenant-subscription.schema';
import { SubscriptionHistory, SubscriptionHistorySchema } from '../../schemas/subscription-history.schema';
import { BillingInvoice, BillingInvoiceSchema } from '../../schemas/billing-invoice.schema';
import { BillingPayment, BillingPaymentSchema } from '../../schemas/billing-payment.schema';
import { UsageRecord, UsageRecordSchema } from '../../schemas/usage-record.schema';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { Membership, MembershipSchema } from '../../schemas/membership.schema';
import { Role, RoleSchema } from '../../schemas/role.schema';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Product, ProductSchema } from '../../schemas/product.schema';
import { InventoryItem, InventoryItemSchema } from '../../schemas/inventory-item.schema';
import { AuditLog, AuditLogSchema } from '../../schemas/audit-log.schema';
import { Counter, CounterSchema } from '../../schemas/counter.schema';

// Services
import { PlatformAuthService } from './services/platform-auth.service';
import { PartnersService } from './services/partners.service';
import { TenantLifecycleService } from './services/tenant-lifecycle.service';
import { SubscriptionPlanService } from './services/subscription-plan.service';
import { TenantSubscriptionService } from './services/tenant-subscription.service';
import { SaasBillingService } from './services/saas-billing.service';
import { SaasUsageService } from './services/saas-usage.service';
import { FeatureGateService } from './services/feature-gate.service';
import { UsageLimitService } from './services/usage-limit.service';
import { PlatformDashboardService } from './services/platform-dashboard.service';
import { SystemHealthService } from './services/system-health.service';
import { MockBillingProvider } from './services/mock-billing-provider.service';
import { AuditModule } from '../audit/audit.module';

// Guards
import { PlatformAuthGuard } from './guards/platform-auth.guard';
import { PlatformPermissionsGuard } from './guards/platform-permissions.guard';
import { PlatformRolesGuard } from './guards/platform-roles.guard';

// Controllers
import { PlatformAuthController } from './controllers/platform-auth.controller';
import { PlatformPartnersController } from './controllers/platform-partners.controller';
import { PartnerPortalController } from './controllers/partner-portal.controller';
import { PlatformTenantsController } from './controllers/platform-tenants.controller';
import { PlatformPlansController } from './controllers/platform-plans.controller';
import { PlatformSubscriptionsController } from './controllers/platform-subscriptions.controller';
import { PlatformBillingController } from './controllers/platform-billing.controller';
import { PlatformUsageController } from './controllers/platform-usage.controller';
import { PlatformAuditController } from './controllers/platform-audit.controller';
import { PlatformSystemHealthController } from './controllers/platform-system-health.controller';
import { PlatformDashboardController } from './controllers/platform-dashboard.controller';

import { PlatformReportsService } from './services/platform-reports.service';
import { PlatformReportsController } from './controllers/platform-reports.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlatformAdmin.name, schema: PlatformAdminSchema },
      { name: Partner.name, schema: PartnerSchema },
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: TenantSubscription.name, schema: TenantSubscriptionSchema },
      { name: SubscriptionHistory.name, schema: SubscriptionHistorySchema },
      { name: BillingInvoice.name, schema: BillingInvoiceSchema },
      { name: BillingPayment.name, schema: BillingPaymentSchema },
      { name: UsageRecord.name, schema: UsageRecordSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Membership.name, schema: MembershipSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'washora_dev_jwt_secret_2026_super_secure'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
    AuditModule,
    ConfigModule,
  ],
  controllers: [
    PlatformAuthController,
    PlatformPartnersController,
    PartnerPortalController,
    PlatformTenantsController,
    PlatformPlansController,
    PlatformSubscriptionsController,
    PlatformBillingController,
    PlatformUsageController,
    PlatformAuditController,
    PlatformSystemHealthController,
    PlatformDashboardController,
    PlatformReportsController,
  ],
  providers: [
    PlatformAuthService,
    PartnersService,
    TenantLifecycleService,
    SubscriptionPlanService,
    TenantSubscriptionService,
    SaasBillingService,
    SaasUsageService,
    FeatureGateService,
    UsageLimitService,
    PlatformDashboardService,
    SystemHealthService,
    PlatformReportsService,
    MockBillingProvider,
    PlatformAuthGuard,
    PlatformPermissionsGuard,
    PlatformRolesGuard,
  ],
  exports: [
    PlatformAuthService,
    PartnersService,
    TenantLifecycleService,
    SubscriptionPlanService,
    TenantSubscriptionService,
    SaasBillingService,
    SaasUsageService,
    FeatureGateService,
    UsageLimitService,
    PlatformDashboardService,
    SystemHealthService,
    PlatformReportsService,
    MockBillingProvider,
    PlatformAuthGuard,
    PlatformPermissionsGuard,
    PlatformRolesGuard,
  ],
})
export class PlatformModule {}
