import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { FeatureGateService } from '../src/modules/platform/services/feature-gate.service';
import { UsageLimitService } from '../src/modules/platform/services/usage-limit.service';
import { SaasBillingService } from '../src/modules/platform/services/saas-billing.service';
import {
  PlatformAdminRole,
  PlatformPermission,
  TenantStatus,
  SubscriptionStatus,
  BillingInterval,
  FeatureKey,
  LimitKey,
  BillingInvoiceStatus,
  BillingPaymentStatus,
} from '@washora/shared';

describe('Phase 10 — SaaS Administration, Subscription & Multi-Tenant Governance', () => {
  let mongod: MongoMemoryServer;
  let app: INestApplication;
  let featureGate: FeatureGateService;
  let usageLimit: UsageLimitService;
  let saasBilling: SaasBillingService;

  // Platform Admin Tokens
  let superAdminToken: string;
  let superAdminId: string;
  let supportAdminToken: string;
  let supportAdminId: string;
  let billingAdminToken: string;
  let billingAdminId: string;
  let readOnlyAdminToken: string;
  let readOnlyAdminId: string;

  // Provisioned Tenant
  let provisionedTenantId: string;
  let provisionedSlug: string;
  let provisionedOwnerToken: string;
  let customPlanId: string;
  let activeSubscriptionId: string;
  let generatedInvoiceId: string;
  let generatedInvoiceNumber: string;

  // Standard Tenant A & B for Isolation tests
  let tenantAToken: string;
  let tenantAId: string;
  let tenantBToken: string;
  let tenantBId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create({
      binary: { version: '7.0.14' },
    });
    process.env.MONGODB_URI = mongod.getUri();
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_jwt_secret_platform_saas_2026';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    featureGate = moduleFixture.get<FeatureGateService>(FeatureGateService);
    usageLimit = moduleFixture.get<UsageLimitService>(UsageLimitService);
    saasBilling = moduleFixture.get<SaasBillingService>(SaasBillingService);

    const timestamp = Date.now();

    // 1. Setup Standard Tenant A (Shop User)
    const regResA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Tenant A Owner',
        email: `tenant_a_${timestamp}@laundry.test`,
        password: 'Password@123',
        phone: `+9198${String(timestamp).slice(-8)}`,
        tenantName: `Tenant A Laundry ${timestamp}`,
        businessType: 'LAUNDRY',
        branchName: 'Branch A1',
      });
    expect(regResA.status).toBe(201);
    tenantAToken = regResA.body.data.accessToken;
    tenantAId = regResA.body.data.tenant.id;

    // 2. Setup Standard Tenant B (Shop User)
    const regResB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Tenant B Owner',
        email: `tenant_b_${timestamp}@laundry.test`,
        password: 'Password@123',
        phone: `+9197${String(timestamp).slice(-8)}`,
        tenantName: `Tenant B Laundry ${timestamp}`,
        businessType: 'LAUNDRY',
        branchName: 'Branch B1',
      });
    expect(regResB.status).toBe(201);
    tenantBToken = regResB.body.data.accessToken;
    tenantBId = regResB.body.data.tenant.id;
  }, 90000);

  afterAll(async () => {
    if (app) await app.close();
    if (mongod) await mongod.stop();
  });

  // =========================================================================
  // 1. Platform Admin Authentication & RBAC
  // =========================================================================
  describe('1. Platform Admin Authentication & RBAC', () => {
    it('1.1 should login as default superadmin with seeded credentials and return admin token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/platform/auth/login')
        .send({
          email: 'admin@washora.com',
          password: 'WashoraAdmin@2026',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.admin.role).toBe(PlatformAdminRole.SUPER_ADMIN);
      superAdminToken = res.body.data.token;
      superAdminId = res.body.data.admin.id;
    });

    it('1.2 should reject invalid login credentials with 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/platform/auth/login')
        .send({
          email: 'admin@washora.com',
          password: 'WrongPassword@123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('1.3 should create SUPPORT_ADMIN, BILLING_ADMIN, and READ_ONLY_ADMIN users', async () => {
      // Create SUPPORT_ADMIN
      const suppRes = await request(app.getHttpServer())
        .post('/api/platform/auth/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'support@washora.com',
          name: 'Tier 1 Support Lead',
          password: 'SupportAdmin@2026',
          role: PlatformAdminRole.SUPPORT_ADMIN,
        });
      expect(suppRes.status).toBe(201);
      supportAdminId = suppRes.body.data.id;

      // Create BILLING_ADMIN
      const billRes = await request(app.getHttpServer())
        .post('/api/platform/auth/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'billing@washora.com',
          name: 'Platform Billing Officer',
          password: 'BillingAdmin@2026',
          role: PlatformAdminRole.BILLING_ADMIN,
        });
      expect(billRes.status).toBe(201);
      billingAdminId = billRes.body.data.id;

      // Create READ_ONLY_ADMIN
      const roRes = await request(app.getHttpServer())
        .post('/api/platform/auth/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'auditor@washora.com',
          name: 'Compliance Auditor',
          password: 'AuditorAdmin@2026',
          role: PlatformAdminRole.READ_ONLY_ADMIN,
        });
      expect(roRes.status).toBe(201);
      readOnlyAdminId = roRes.body.data.id;
    });

    it('1.4 should authenticate SUPPORT_ADMIN and return granular permissions', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/platform/auth/login')
        .send({
          email: 'support@washora.com',
          password: 'SupportAdmin@2026',
        });

      expect(res.status).toBe(200);
      supportAdminToken = res.body.data.token;
      expect(res.body.data.admin.role).toBe(PlatformAdminRole.SUPPORT_ADMIN);
      expect(res.body.data.admin.permissions).toContain(PlatformPermission.TENANTS_VIEW);
      expect(res.body.data.admin.permissions).not.toContain(PlatformPermission.PLANS_CREATE);
    });

    it('1.5 should authenticate BILLING_ADMIN and READ_ONLY_ADMIN', async () => {
      const bRes = await request(app.getHttpServer())
        .post('/api/platform/auth/login')
        .send({ email: 'billing@washora.com', password: 'BillingAdmin@2026' });
      expect(bRes.status).toBe(200);
      billingAdminToken = bRes.body.data.token;

      const rRes = await request(app.getHttpServer())
        .post('/api/platform/auth/login')
        .send({ email: 'auditor@washora.com', password: 'AuditorAdmin@2026' });
      expect(rRes.status).toBe(200);
      readOnlyAdminToken = rRes.body.data.token;
    });

    it('1.6 should get current admin profile via /api/platform/auth/me', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/platform/auth/me')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('admin@washora.com');
      expect(res.body.data.role).toBe(PlatformAdminRole.SUPER_ADMIN);
    });

    it('1.7 should update admin profile name', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/platform/auth/me')
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .send({ name: 'Senior Support Specialist' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Senior Support Specialist');
    });

    it('1.8 should prevent deactivated admin from logging in', async () => {
      // Deactivate read-only admin
      await request(app.getHttpServer())
        .patch(`/api/platform/auth/users/${readOnlyAdminId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ isActive: false });

      // Attempt login
      const res = await request(app.getHttpServer())
        .post('/api/platform/auth/login')
        .send({ email: 'auditor@washora.com', password: 'AuditorAdmin@2026' });

      expect(res.status).toBe(403);

      // Reactivate for subsequent testing
      await request(app.getHttpServer())
        .patch(`/api/platform/auth/users/${readOnlyAdminId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ isActive: true });
    });
  });

  // =========================================================================
  // 2. Tenant Provisioning & Onboarding
  // =========================================================================
  describe('2. Tenant Provisioning & Onboarding', () => {
    it('2.1 should provision a new laundry tenant with owner, primary branch, and starter subscription', async () => {
      const ts = Date.now();
      const res = await request(app.getHttpServer())
        .post('/api/platform/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          businessName: `CleanWave Hub ${ts}`,
          slug: `cleanwave-${ts}`,
          ownerName: 'Vikas Sharma',
          ownerEmail: `vikas_${ts}@cleanwave.test`,
          ownerPhone: '+919811223344',
          ownerPassword: 'TempPassword@123',
          primaryBranchName: 'CleanWave Indiranagar Hub',
          trialDays: 14,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenant.id).toBeDefined();
      expect(res.body.data.tenant.status).toBe(TenantStatus.TRIAL);
      expect(res.body.data.owner.email).toBe(`vikas_${ts}@cleanwave.test`);
      expect(res.body.data.subscription.status).toBe(SubscriptionStatus.TRIALING);

      provisionedTenantId = res.body.data.tenant.id;
      provisionedSlug = res.body.data.tenant.slug;
      activeSubscriptionId = res.body.data.subscription.id;
    });

    it('2.2 should reject duplicate tenant slug during provisioning with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/platform/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          businessName: 'Duplicate Slug Hub',
          slug: provisionedSlug,
          ownerName: 'Another Owner',
          ownerEmail: 'another@duplicate.test',
          ownerPhone: '+919800000000',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('2.3 should allow provisioned owner to log in via standard authentication', async () => {
      const tenantRes = await request(app.getHttpServer())
        .get(`/api/platform/tenants/${provisionedTenantId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      const ownerEmail = tenantRes.body.data.owner.email;

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: ownerEmail,
          password: 'TempPassword@123',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.accessToken).toBeDefined();
      provisionedOwnerToken = loginRes.body.data.accessToken;
    });

    it('2.4 should retrieve tenant 360 overview with accurate initial counts', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/platform/tenants/${provisionedTenantId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.stats.branchesCount).toBe(1);
      expect(res.body.data.stats.staffCount).toBe(1); // Owner
      expect(res.body.data.stats.customersCount).toBe(0);
      expect(res.body.data.usage.metrics.branches.percentage).toBeLessThanOrEqual(100);
    });
  });

  // =========================================================================
  // 3. Tenant Lifecycle State Machine
  // =========================================================================
  describe('3. Tenant Lifecycle State Machine', () => {
    it('3.1 should verify tenant legitimacy and update isVerified status', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/platform/tenants/${provisionedTenantId}/verify`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ isVerified: true });

      expect(res.status).toBe(200);
      expect(res.body.data.settings.isVerified).toBe(true);
    });

    it('3.2 should transition tenant from TRIAL to ACTIVE', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/platform/tenants/${provisionedTenantId}/activate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ reason: 'Tenant subscribed to paid plan' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(TenantStatus.ACTIVE);
    });

    it('3.3 should transition tenant from ACTIVE to PAST_DUE on payment delinquency', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/platform/tenants/${provisionedTenantId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: TenantStatus.PAST_DUE });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(TenantStatus.PAST_DUE);
    });

    it('3.4 should transition tenant from PAST_DUE to SUSPENDED and pause subscriptions', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/platform/tenants/${provisionedTenantId}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ reason: 'Payment overdue by 30 days' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(TenantStatus.SUSPENDED);

      // Verify subscription is PAUSED
      const subRes = await request(app.getHttpServer())
        .get(`/api/platform/subscriptions/${activeSubscriptionId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(subRes.body.data.status).toBe(SubscriptionStatus.PAUSED);
    });

    it('3.5 should transition tenant from SUSPENDED back to ACTIVE on settlement', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/platform/tenants/${provisionedTenantId}/activate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ reason: 'Outstanding invoice settled in full' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(TenantStatus.ACTIVE);

      // Verify subscription is reactivated
      const subRes = await request(app.getHttpServer())
        .get(`/api/platform/subscriptions/${activeSubscriptionId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(subRes.body.data.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('3.6 should transition tenant from ACTIVE to CANCELLED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/platform/tenants/${provisionedTenantId}/cancel`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ reason: 'Tenant requested account closure' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(TenantStatus.CANCELLED);
    });

    it('3.7 should transition tenant from CANCELLED to ARCHIVED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/platform/tenants/${provisionedTenantId}/archive`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ reason: 'Data retention period ended' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(TenantStatus.ARCHIVED);
    });

    it('3.8 should reject invalid state transition (ARCHIVED -> ACTIVE) with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/platform/tenants/${provisionedTenantId}/activate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ reason: 'Attempt to revive archived tenant' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid lifecycle state transition');
    });
  });

  // =========================================================================
  // 4. Subscription Plans Management
  // =========================================================================
  describe('4. Subscription Plans Management', () => {
    it('4.1 should list default seeded plans (Starter, Professional, Enterprise)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/platform/plans');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      const slugs = res.body.data.map((p: any) => p.slug);
      expect(slugs).toContain('starter');
      expect(slugs).toContain('professional');
      expect(slugs).toContain('enterprise');
    });

    it('4.2 should create a custom subscription plan tier with modular features & limits', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/platform/plans')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Growth Scale Plan',
          slug: `growth-scale-${Date.now()}`,
          description: 'Designed for fast growing 5-branch laundry chains',
          billingInterval: BillingInterval.MONTHLY,
          price: 3999,
          currency: 'INR',
          trialDays: 14,
          features: {
            [FeatureKey.POS]: true,
            [FeatureKey.CUSTOMERS]: true,
            [FeatureKey.ORDERS]: true,
            [FeatureKey.PROCESSING]: true,
            [FeatureKey.QC]: true,
            [FeatureKey.STAFF]: true,
            [FeatureKey.ATTENDANCE]: true,
            [FeatureKey.PAYROLL]: true,
            [FeatureKey.EXPENSES]: true,
            [FeatureKey.INVENTORY]: true,
            [FeatureKey.PICKUP_DELIVERY]: true,
            [FeatureKey.CUSTOMER_PORTAL]: true,
            [FeatureKey.MULTI_BRANCH]: true,
            [FeatureKey.WHATSAPP]: true,
          },
          limits: {
            [LimitKey.MAX_BRANCHES]: 5,
            [LimitKey.MAX_STAFF]: 25,
            [LimitKey.MAX_CUSTOMERS]: 5000,
            [LimitKey.MAX_MONTHLY_ORDERS]: 2500,
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Growth Scale Plan');
      expect(res.body.data.price).toBe(3999);
      customPlanId = res.body.data._id || res.body.data.id;
    });

    it('4.3 should reject duplicate plan slug with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/platform/plans')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Starter Clone',
          slug: 'starter',
          price: 999,
          features: {},
          limits: {},
        });

      expect(res.status).toBe(409);
    });

    it('4.4 should update plan metadata and pricing', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/platform/plans/${customPlanId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          price: 4499,
          description: 'Updated description for growth scale plan',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.price).toBe(4499);
      expect(res.body.data.description).toBe('Updated description for growth scale plan');
    });

    it('4.5 should archive a plan tier', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/platform/plans/${customPlanId}/archive`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);
      expect(res.body.data.isPublic).toBe(false);
    });

    it('4.6 should delete an unreferenced plan tier', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/platform/plans/${customPlanId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('deleted successfully');
    });
  });

  // =========================================================================
  // 5. Feature Entitlements & Gates
  // =========================================================================
  describe('5. Feature Entitlements & Gates', () => {
    it('5.1 should verify POS feature is enabled for Tenant A (Starter Plan)', async () => {
      const isPosEnabled = await featureGate.isEnabled(tenantAId, FeatureKey.POS);
      expect(isPosEnabled).toBe(true);
    });

    it('5.2 should verify PAYROLL feature is disabled for Starter Plan and assert throws ForbiddenException', async () => {
      // Create a subscription on Starter plan for Tenant A to ensure deterministic feature gate test
      const starterPlan = await request(app.getHttpServer()).get('/api/platform/plans');
      const starter = starterPlan.body.data.find((p: any) => p.slug === 'starter');

      await request(app.getHttpServer())
        .post('/api/platform/subscriptions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          tenantId: tenantAId,
          planId: starter._id || starter.id,
          startTrial: false,
        });

      const isPayrollEnabled = await featureGate.isEnabled(tenantAId, FeatureKey.PAYROLL);
      expect(isPayrollEnabled).toBe(false);

      await expect(featureGate.assertEnabled(tenantAId, FeatureKey.PAYROLL)).rejects.toThrow();
    });

    it('5.3 should verify WHATSAPP is disabled on Starter but enabled on Professional plan', async () => {
      const starterWhatsApp = await featureGate.isEnabled(tenantAId, FeatureKey.WHATSAPP);
      expect(starterWhatsApp).toBe(false);

      // Check for Tenant B on Professional
      const plansRes = await request(app.getHttpServer()).get('/api/platform/plans');
      const proPlan = plansRes.body.data.find((p: any) => p.slug === 'professional');

      await request(app.getHttpServer())
        .post('/api/platform/subscriptions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          tenantId: tenantBId,
          planId: proPlan._id || proPlan.id,
          startTrial: false,
        });

      const proWhatsApp = await featureGate.isEnabled(tenantBId, FeatureKey.WHATSAPP);
      expect(proWhatsApp).toBe(true);
    });

    it('5.4 should dynamically unlock PAYROLL upon upgrading Tenant A to Professional plan', async () => {
      const plansRes = await request(app.getHttpServer()).get('/api/platform/plans');
      const proPlan = plansRes.body.data.find((p: any) => p.slug === 'professional');

      // Upgrade Tenant A
      const subRes = await request(app.getHttpServer())
        .get(`/api/platform/subscriptions?tenantId=${tenantAId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      const subAId = subRes.body.data.items[0]._id || subRes.body.data.items[0].id;

      await request(app.getHttpServer())
        .post(`/api/platform/subscriptions/${subAId}/change-plan`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          newPlanId: proPlan._id || proPlan.id,
          reason: 'Upgrading to access payroll automation',
        });

      const isPayrollEnabledNow = await featureGate.isEnabled(tenantAId, FeatureKey.PAYROLL);
      expect(isPayrollEnabledNow).toBe(true);
    });
  });

  // =========================================================================
  // 6. Plan Limit Enforcement
  // =========================================================================
  describe('6. Plan Limit Enforcement', () => {
    it('6.1 should verify branch limit enforcement (MAX_BRANCHES) via UsageLimitService', async () => {
      // Put Tenant A back on Starter (limit = 1 branch)
      const plansRes = await request(app.getHttpServer()).get('/api/platform/plans');
      const starterPlan = plansRes.body.data.find((p: any) => p.slug === 'starter');

      const subRes = await request(app.getHttpServer())
        .get(`/api/platform/subscriptions?tenantId=${tenantAId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      const subAId = subRes.body.data.items[0]._id || subRes.body.data.items[0].id;

      await request(app.getHttpServer())
        .post(`/api/platform/subscriptions/${subAId}/change-plan`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ newPlanId: starterPlan._id || starterPlan.id });

      // Tenant A currently has 1 branch (within limit)
      const withinLimit = await usageLimit.isWithinLimit(tenantAId, LimitKey.MAX_BRANCHES, 0);
      expect(withinLimit).toBe(true);

      // Adding a 2nd branch exceeds limit of 1
      const canAddSecond = await usageLimit.isWithinLimit(tenantAId, LimitKey.MAX_BRANCHES, 1);
      expect(canAddSecond).toBe(false);

      await expect(usageLimit.assertWithinLimit(tenantAId, LimitKey.MAX_BRANCHES, 1)).rejects.toThrow();
    });

    it('6.2 should verify customer count limit enforcement (MAX_CUSTOMERS)', async () => {
      const currentCustomers = await usageLimit.getCurrentUsageCount(tenantAId, LimitKey.MAX_CUSTOMERS);
      expect(currentCustomers).toBeGreaterThanOrEqual(0);

      const limit = await usageLimit.getLimit(tenantAId, LimitKey.MAX_CUSTOMERS);
      expect(limit).toBe(500); // Starter limit
    });
  });

  // =========================================================================
  // 7. Tenant Subscriptions & Trials
  // =========================================================================
  describe('7. Tenant Subscriptions & Trials', () => {
    let testSubId: string;

    it('7.1 should create a trialing subscription for a tenant', async () => {
      const plansRes = await request(app.getHttpServer()).get('/api/platform/plans');
      const proPlan = plansRes.body.data.find((p: any) => p.slug === 'professional');

      const res = await request(app.getHttpServer())
        .post('/api/platform/subscriptions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          tenantId: tenantAId,
          planId: proPlan._id || proPlan.id,
          startTrial: true,
          trialDays: 14,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe(SubscriptionStatus.TRIALING);
      expect(res.body.data.trialEnd).toBeDefined();
      testSubId = res.body.data._id || res.body.data.id;
    });

    it('7.2 should convert trialing subscription to paid ACTIVE subscription', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/platform/subscriptions/${testSubId}/convert-trial`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ billingInterval: BillingInterval.MONTHLY });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(SubscriptionStatus.ACTIVE);
      expect(res.body.data.cancelAtPeriodEnd).toBe(false);
    });

    it('7.3 should cancel subscription at period end', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/platform/subscriptions/${testSubId}/cancel`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ immediate: false, reason: 'Non-renewal notice' });

      expect(res.status).toBe(200);
      expect(res.body.data.cancelAtPeriodEnd).toBe(true);
    });

    it('7.4 should reactivate subscription and reset cancelAtPeriodEnd flag', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/platform/subscriptions/${testSubId}/reactivate`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(SubscriptionStatus.ACTIVE);
      expect(res.body.data.cancelAtPeriodEnd).toBe(false);
    });

    it('7.5 should manually override subscription period dates with audit note', async () => {
      const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app.getHttpServer())
        .patch(`/api/platform/subscriptions/${testSubId}/manual`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          currentPeriodEnd: futureDate,
          reason: 'Promotional 60-day goodwill extension',
        });

      expect(res.status).toBe(200);
      expect(new Date(res.body.data.currentPeriodEnd).toISOString()).toBe(futureDate);
    });
  });

  // =========================================================================
  // 8. Plan Upgrades, Downgrades & History
  // =========================================================================
  describe('8. Plan Upgrades, Downgrades & History', () => {
    it('8.1 should record chronological history events for plan changes and cancellations', async () => {
      const subRes = await request(app.getHttpServer())
        .get(`/api/platform/subscriptions?tenantId=${tenantAId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      const subAId = subRes.body.data.items[0]._id || subRes.body.data.items[0].id;

      const histRes = await request(app.getHttpServer())
        .get(`/api/platform/subscriptions/${subAId}/history`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(histRes.status).toBe(200);
      expect(histRes.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 9. SaaS Platform Billing & Invoices
  // =========================================================================
  describe('9. SaaS Platform Billing & Invoices', () => {
    it('9.1 should generate a SaaS billing invoice with atomic SINV-000001 sequence', async () => {
      const subRes = await request(app.getHttpServer())
        .get(`/api/platform/subscriptions?tenantId=${tenantAId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      const subAId = subRes.body.data.items[0]._id || subRes.body.data.items[0].id;

      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const res = await request(app.getHttpServer())
        .post('/api/platform/billing/invoices')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          tenantId: tenantAId,
          subscriptionId: subAId,
          billingPeriodStart: now.toISOString(),
          billingPeriodEnd: nextMonth.toISOString(),
          subtotal: 2499,
          dueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.invoiceNumber).toMatch(/^SINV-\d{6}$/);
      expect(res.body.data.subtotal).toBe(2499);
      expect(res.body.data.tax).toBe(449.82); // 18% GST
      expect(res.body.data.total).toBe(2948.82);
      expect(res.body.data.status).toBe(BillingInvoiceStatus.OPEN);

      generatedInvoiceId = res.body.data._id || res.body.data.id;
      generatedInvoiceNumber = res.body.data.invoiceNumber;
    });

    it('9.2 should retrieve invoice by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/platform/billing/invoices/${generatedInvoiceId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.invoiceNumber).toBe(generatedInvoiceNumber);
      expect(res.body.data.tenantId.name).toBeDefined();
    });

    it('9.3 should record a successful billing payment with atomic SPAY-000001 sequence and mark invoice PAID', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/platform/billing/payments')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          invoiceId: generatedInvoiceId,
          amount: 2948.82,
          provider: 'MOCK_GATEWAY',
          providerPaymentId: `pay_test_${Date.now()}`,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.payment.paymentNumber).toMatch(/^SPAY-\d{6}$/);
      expect(res.body.data.payment.status).toBe(BillingPaymentStatus.SUCCESS);
      expect(res.body.data.invoice.status).toBe(BillingInvoiceStatus.PAID);
    });

    it('9.4 should reject duplicate payment on already settled invoice with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/platform/billing/payments')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          invoiceId: generatedInvoiceId,
          amount: 2948.82,
        });

      expect(res.status).toBe(409);
    });

    it('9.5 should get billing overview metrics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/platform/billing/overview')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalRevenue).toBeGreaterThanOrEqual(2948.82);
      expect(res.body.data.totalInvoices).toBeGreaterThanOrEqual(1);
      expect(res.body.data.totalPayments).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 10. Payment Gateway Abstraction & Webhook Idempotency
  // =========================================================================
  describe('10. Payment Gateway Abstraction & Webhook Idempotency', () => {
    let webhookInvoiceNumber: string;

    it('10.1 should create a new open invoice for webhook testing', async () => {
      const subRes = await request(app.getHttpServer())
        .get(`/api/platform/subscriptions?tenantId=${tenantBId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      const subBId = subRes.body.data.items[0]._id || subRes.body.data.items[0].id;

      const now = new Date();
      const invRes = await request(app.getHttpServer())
        .post('/api/platform/billing/invoices')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          tenantId: tenantBId,
          subscriptionId: subBId,
          billingPeriodStart: now.toISOString(),
          billingPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          subtotal: 2499,
          dueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      expect(invRes.status).toBe(201);
      webhookInvoiceNumber = invRes.body.data.invoiceNumber;
    });

    it('10.2 should process payment.success webhook and mark invoice PAID', async () => {
      const eventId = `evt_test_${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/platform/billing/webhook')
        .send({
          event: 'payment.success',
          eventId,
          payload: {
            invoiceNumber: webhookInvoiceNumber,
            amount: 2948.82,
            providerPaymentId: `pay_webhook_${Date.now()}`,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });

    it('10.3 should process duplicate webhook event idempotently without creating duplicate records', async () => {
      const eventId = `evt_test_duplicate_999`;
      // First submission
      await request(app.getHttpServer())
        .post('/api/platform/billing/webhook')
        .send({
          event: 'payment.success',
          eventId,
          payload: {
            invoiceNumber: webhookInvoiceNumber,
            amount: 2948.82,
          },
        });

      // Second identical submission
      const res = await request(app.getHttpServer())
        .post('/api/platform/billing/webhook')
        .send({
          event: 'payment.success',
          eventId,
          payload: {
            invoiceNumber: webhookInvoiceNumber,
            amount: 2948.82,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isDuplicate).toBe(true);
    });
  });

  // =========================================================================
  // 11. SaaS Usage Tracking & Capacity
  // =========================================================================
  describe('11. SaaS Usage Tracking & Capacity', () => {
    it('11.1 should get detailed usage summary for a tenant', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/platform/usage/${tenantAId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.metrics.branches).toBeDefined();
      expect(res.body.data.metrics.staff).toBeDefined();
      expect(res.body.data.metrics.customers).toBeDefined();
      expect(res.body.data.metrics.monthlyOrders).toBeDefined();
    });

    it('11.2 should get cross-tenant usage summaries', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/platform/usage')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('11.3 should allow tenant to view own usage via /api/subscriptions/usage', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/subscriptions/usage')
        .set('Authorization', `Bearer ${tenantAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tenantId).toBe(tenantAId);
    });
  });

  // =========================================================================
  // 12. Multi-Tenant Security & Platform Isolation
  // =========================================================================
  describe('12. Multi-Tenant Security & Platform Isolation', () => {
    it('12.1 should reject shop owner token from accessing platform admin endpoints (401/403)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/platform/tenants')
        .set('Authorization', `Bearer ${tenantAToken}`);

      expect([401, 403]).toContain(res.status);
    });

    it('12.2 should reject unauthenticated requests to /api/platform/*', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/platform/dashboard');

      expect(res.status).toBe(401);
    });

    it('12.3 should reject SUPPORT_ADMIN from creating subscription plans (403)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/platform/plans')
        .set('Authorization', `Bearer ${supportAdminToken}`)
        .send({
          name: 'Unauthorized Plan',
          slug: 'unauthorized-plan',
          price: 999,
          features: {},
          limits: {},
        });

      expect(res.status).toBe(403);
    });

    it('12.4 should reject READ_ONLY_ADMIN from provisioning tenants (403)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/platform/tenants')
        .set('Authorization', `Bearer ${readOnlyAdminToken}`)
        .send({
          businessName: 'Unauthorized Tenant',
          ownerName: 'Unauthorized',
          ownerEmail: 'unauth@test.com',
          ownerPhone: '+919999999999',
        });

      expect(res.status).toBe(403);
    });

    it('12.5 should reject BILLING_ADMIN from suspending tenants (403)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/platform/tenants/${tenantAId}/suspend`)
        .set('Authorization', `Bearer ${billingAdminToken}`)
        .send({ reason: 'Unauthorized suspension' });

      expect(res.status).toBe(403);
    });

    it('12.6 should prevent Tenant A from accessing Tenant B subscription via tenant API', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${tenantAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tenantId.toString()).toBe(tenantAId);
      expect(res.body.data.tenantId.toString()).not.toBe(tenantBId);
    });

    it('12.7 should prevent Tenant A from viewing Tenant B invoices', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/subscriptions/invoices')
        .set('Authorization', `Bearer ${tenantAToken}`);

      expect(res.status).toBe(200);
      const invoices = res.body.data.items || [];
      invoices.forEach((inv: any) => {
        expect(inv.tenantId._id.toString()).toBe(tenantAId);
        expect(inv.tenantId._id.toString()).not.toBe(tenantBId);
      });
    });
  });

  // =========================================================================
  // 13. Platform Governance Audit & System Health
  // =========================================================================
  describe('13. Platform Governance Audit & System Health', () => {
    it('13.1 should query platform audit logs with pagination and action filtering', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/platform/audit?action=PLATFORM_')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });

    it('13.2 should verify sensitive admin actions are recorded in audit logs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/platform/audit')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const actions = res.body.data.items.map((a: any) => a.action);
      expect(actions).toContain('PLATFORM_ADMIN_LOGIN');
    });

    it('13.3 should verify passwords and secret keys are NOT leaked in audit log metadata', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/platform/audit')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const metadataString = JSON.stringify(res.body.data.items);
      expect(metadataString).not.toContain('WashoraAdmin@2026');
      expect(metadataString).not.toContain('TempPassword@123');
    });

    it('13.4 should return safe infrastructure health diagnostics from /api/platform/system-health', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/platform/system-health')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('HEALTHY');
      expect(res.body.data.database.connected).toBe(true);
      expect(res.body.data.memory.rssMb).toBeGreaterThan(0);
    });

    it('13.5 should verify system health endpoint never leaks environment variables or database credentials', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/platform/system-health')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const healthString = JSON.stringify(res.body.data);
      expect(healthString).not.toContain('mongodb://');
      expect(healthString).not.toContain('JWT_SECRET');
    });
  });
});
