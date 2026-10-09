import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { CommonInfrastructureModule } from './common/common.module';
import { CorrelationIdMiddleware } from './common/middlewares/correlation-id.middleware';
import { AuditModule } from './modules/audit/audit.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { UsersModule } from './modules/users/users.module';
import { BranchesModule } from './modules/branches/branches.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ServicesModule } from './modules/services/services.module';
import { ProductsModule } from './modules/products/products.module';
import { CustomersModule } from './modules/customers/customers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { GarmentsModule } from './modules/garments/garments.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProcessingModule } from './modules/processing/processing.module';
import { StaffModule } from './modules/staff/staff.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { FinanceModule } from './modules/finance/finance.module';
import { PickupsModule } from './modules/pickups/pickups.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CustomerPortalModule } from './modules/customer-portal/customer-portal.module';
import { PlatformModule } from './modules/platform/platform.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', 'apps/api/.env', '../apps/api/.env', '../../.env'],
    }),
    CommonInfrastructureModule,
    DatabaseModule,
    AuditModule,
    RolesModule,
    AuthModule,
    TenantsModule,
    MembershipsModule,
    UsersModule,
    BranchesModule,
    SettingsModule,
    CategoriesModule,
    ServicesModule,
    ProductsModule,
    CustomersModule,
    OrdersModule,
    GarmentsModule,
    PaymentsModule,
    ProcessingModule,
    StaffModule,
    ExpensesModule,
    SuppliersModule,
    InventoryModule,
    PurchasesModule,
    FinanceModule,
    PickupsModule,
    DeliveriesModule,
    LogisticsModule,
    NotificationsModule,
    CustomerPortalModule,
    PlatformModule,
    SubscriptionsModule,
    ReportsModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
