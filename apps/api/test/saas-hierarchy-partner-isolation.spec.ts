import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PlatformAdminRole, RoleType, PermissionCode, TenantStatus, BusinessType } from '@washora/shared';

describe('SaaS Hierarchy, Partner Isolation & Custom Roles Suite', () => {
  let mongod: MongoMemoryServer;
  let app: INestApplication;
  let connection: Connection;

  let superAdminToken: string;
  let partnerAToken: string;
  let partnerBToken: string;
  let partnerAId: string;
  let partnerBId: string;

  let shopA1Id: string;
  let shopA2Id: string;
  let shopB1Id: string;
  let shopB2Id: string;

  let shopA1Token: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create({
      binary: { version: '7.0.14' },
    });
    process.env.MONGODB_URI = mongod.getUri();
    process.env.JWT_SECRET = 'test_hierarchy_secret_key_2026_super_secure';
    process.env.JWT_ACCESS_SECRET = 'test_hierarchy_secret_key_2026_super_secure';
    process.env.JWT_REFRESH_SECRET = 'test_hierarchy_refresh_secret_key_2026_super_secure';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
    connection = moduleFixture.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }
    if (app) {
      await app.close();
    }
    if (mongod) {
      await mongod.stop();
    }
  });

  describe('1. Super Admin Authentication & Partner Provisioning', () => {
    it('should login as Platform Super Admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/platform/auth/login')
        .send({
          email: 'admin@washora.com',
          password: 'WashoraAdmin@2026',
        })
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.admin.role).toBe(PlatformAdminRole.SUPER_ADMIN);
      superAdminToken = res.body.data.token;
    });

    it('Super Admin should create Partner A (Karnataka Sales Partner)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/platform/partners')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Karnataka Laundry Partners',
          email: 'partner.a@washora.com',
          phone: '+919888811111',
          companyName: 'KLP Enterprises LLP',
          code: 'PARTNER-BLR-01',
          commissionRate: 20,
          password: 'PartnerA@123456',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Karnataka Laundry Partners');
      expect(res.body.data.code).toBe('PARTNER-BLR-01');
      expect(res.body.data.commissionRate).toBe(20);
      partnerAId = res.body.data._id || res.body.data.id;
    });

    it('Super Admin should create Partner B (Maharashtra Sales Partner)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/platform/partners')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Maharashtra Retail Partners',
          email: 'partner.b@washora.com',
          phone: '+919888822222',
          companyName: 'MRP Solutions Pvt Ltd',
          code: 'PARTNER-MUM-01',
          commissionRate: 15,
          password: 'PartnerB@123456',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('PARTNER-MUM-01');
      partnerBId = res.body.data._id || res.body.data.id;
    });

    it('Super Admin should list all partners and view metrics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/platform/partners')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      const codes = res.body.data.map((p: any) => p.code);
      expect(codes).toContain('PARTNER-BLR-01');
      expect(codes).toContain('PARTNER-MUM-01');
    });
  });

  describe('2. Partner Authentication & Tenant Scoping', () => {
    it('Partner A should login successfully and receive PARTNER_ADMIN role', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/platform/auth/login')
        .send({
          email: 'partner.a@washora.com',
          password: 'PartnerA@123456',
        })
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.admin.role).toBe(PlatformAdminRole.PARTNER_ADMIN);
      expect(res.body.data.admin.partnerId).toBeDefined();
      partnerAToken = res.body.data.token;
    });

    it('Partner B should login successfully and receive PARTNER_ADMIN role', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/platform/auth/login')
        .send({
          email: 'partner.b@washora.com',
          password: 'PartnerB@123456',
        })
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.admin.role).toBe(PlatformAdminRole.PARTNER_ADMIN);
      expect(res.body.data.admin.partnerId).toBeDefined();
      partnerBToken = res.body.data.token;
    });

    it('Partner A onboards Shop A1 and Shop A2', async () => {
      // Onboard Shop A1
      const res1 = await request(app.getHttpServer())
        .post('/api/partner/onboard-client')
        .set('Authorization', `Bearer ${partnerAToken}`)
        .send({
          shopName: 'CleanSprint Indiranagar',
          ownerName: 'Anand Kumar',
          ownerEmail: 'anand@cleansprint.in',
          ownerPhone: '+919900011111',
          businessType: BusinessType.LAUNDRY,
        })
        .expect(HttpStatus.CREATED);

      expect(res1.body.success).toBe(true);
      shopA1Id = res1.body.data.tenant.id;

      // Onboard Shop A2
      const res2 = await request(app.getHttpServer())
        .post('/api/partner/onboard-client')
        .set('Authorization', `Bearer ${partnerAToken}`)
        .send({
          shopName: 'CleanSprint Koramangala',
          ownerName: 'Sunil Rao',
          ownerEmail: 'sunil@cleansprint.in',
          ownerPhone: '+919900022222',
          businessType: BusinessType.DRY_CLEANING,
        })
        .expect(HttpStatus.CREATED);

      expect(res2.body.success).toBe(true);
      shopA2Id = res2.body.data.tenant.id;
    });

    it('Partner B onboards Shop B1 and Shop B2', async () => {
      // Onboard Shop B1
      const res1 = await request(app.getHttpServer())
        .post('/api/partner/onboard-client')
        .set('Authorization', `Bearer ${partnerBToken}`)
        .send({
          shopName: 'Mumbai Wash Hub Bandra',
          ownerName: 'Rohan Mehta',
          ownerEmail: 'rohan@mumbaiwash.com',
          ownerPhone: '+919900033333',
          businessType: BusinessType.LAUNDRY,
        })
        .expect(HttpStatus.CREATED);

      expect(res1.body.success).toBe(true);
      shopB1Id = res1.body.data.tenant.id;

      // Onboard Shop B2
      const res2 = await request(app.getHttpServer())
        .post('/api/partner/onboard-client')
        .set('Authorization', `Bearer ${partnerBToken}`)
        .send({
          shopName: 'Mumbai Wash Hub Andheri',
          ownerName: 'Deepak Shah',
          ownerEmail: 'deepak@mumbaiwash.com',
          ownerPhone: '+919900044444',
          businessType: BusinessType.GARMENT_CARE,
        })
        .expect(HttpStatus.CREATED);

      expect(res2.body.success).toBe(true);
      shopB2Id = res2.body.data.tenant.id;
    });
  });

  describe('3. Strict Partner Data Isolation Enforcement', () => {
    it('Partner A dashboard returns ONLY Shop A1 & Shop A2 (Count: 2)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/partner/dashboard')
        .set('Authorization', `Bearer ${partnerAToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.totalTenants).toBe(2);
      const tenantIds = res.body.data.tenants.map((t: any) => t.id);
      expect(tenantIds).toContain(shopA1Id);
      expect(tenantIds).toContain(shopA2Id);
      expect(tenantIds).not.toContain(shopB1Id);
      expect(tenantIds).not.toContain(shopB2Id);
    });

    it('Partner B dashboard returns ONLY Shop B1 & Shop B2 (Count: 2)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/partner/dashboard')
        .set('Authorization', `Bearer ${partnerBToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.totalTenants).toBe(2);
      const tenantIds = res.body.data.tenants.map((t: any) => t.id);
      expect(tenantIds).toContain(shopB1Id);
      expect(tenantIds).toContain(shopB2Id);
      expect(tenantIds).not.toContain(shopA1Id);
      expect(tenantIds).not.toContain(shopA2Id);
    });

    it('Partner A cannot view Partner B shop details (/api/partner/clients/:shopB1Id)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/partner/clients/${shopB1Id}`)
        .set('Authorization', `Bearer ${partnerAToken}`);

      expect(res.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('Partner B cannot view Partner A shop details (/api/partner/clients/:shopA1Id)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/partner/clients/${shopA1Id}`)
        .set('Authorization', `Bearer ${partnerBToken}`);

      expect(res.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('Partner A cannot access Super Admin endpoints (/api/platform/partners)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/platform/partners')
        .set('Authorization', `Bearer ${partnerAToken}`);

      expect(res.status).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('4. Shop Tenant Custom Roles & Granular Permissions', () => {
    it('Shop A1 owner should login', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'anand@cleansprint.in',
          password: 'Washora@123456',
        })
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      shopA1Token = res.body.data.accessToken;
    });

    it('Shop A1 owner can fetch configurable permission catalog', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/roles/permissions/catalog')
        .set('Authorization', `Bearer ${shopA1Token}`)
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
      const categories = res.body.data.map((c: any) => c.category);
      expect(categories).toContain('Orders & POS Counter');
      expect(categories).toContain('Payments & Billing');
    });

    it('Shop A1 owner can create custom role "Intake Specialist"', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/roles')
        .set('Authorization', `Bearer ${shopA1Token}`)
        .send({
          name: 'Intake Specialist',
          description: 'Responsible for receiving clothes and customer CRM notes',
          permissions: [
            PermissionCode.ORDER_CREATE,
            PermissionCode.ORDER_VIEW,
            PermissionCode.CUSTOMER_CREATE,
            PermissionCode.CUSTOMER_VIEW,
          ],
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Intake Specialist');
      expect(res.body.data.isSystem).toBe(false);
      expect(res.body.data.permissions).toHaveLength(4);
    });

    it('Shop A1 owner lists roles and sees both system templates and custom roles', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/roles')
        .set('Authorization', `Bearer ${shopA1Token}`)
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const names = res.body.data.map((r: any) => r.name);
      expect(names).toContain('Shop Owner');
      expect(names).toContain('Branch Manager');
      expect(names).toContain('Cashier');
    });
  });

  describe('5. Shop Owner Registration, Password Reset, Impersonation & Direct Access Suite', () => {
    let newShopId: string;
    let tempPass: string;

    it('should register a new Shop Owner via public signup with 14-day trial', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Vikram Mehta',
          email: 'vikram@mehtalaundry.in',
          password: 'Password@123',
          phone: '+919777722222',
          tenantName: 'Mehta Express Laundry Hub',
          businessType: BusinessType.LAUNDRY,
          branchName: 'Koramangala Hub',
          partnerCode: 'PARTNER-BLR-01',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.tenant.name).toBe('Mehta Express Laundry Hub');
      newShopId = res.body.data.tenant.id;
    });

    it('should reject duplicate email during public signup', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Vikram Duplicate',
          email: 'vikram@mehtalaundry.in',
          password: 'Password@123',
          phone: '+919777733333',
          tenantName: 'Duplicate Laundry',
        });

      expect(res.status).toBe(HttpStatus.CONFLICT);
    });

    it('Super Admin lists tenants and sees enriched owner metadata and partner code', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/platform/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      const found = res.body.data.items.find((t: any) => t.id === newShopId);
      expect(found).toBeDefined();
      expect(found.ownerEmail).toBe('vikram@mehtalaundry.in');
      expect(found.ownerName).toBe('Vikram Mehta');
      expect(found.partnerCode).toBe('PARTNER-BLR-01');
      expect(found.planName).toBeDefined();
    });

    it('Super Admin can generate single-use temporary password for shop owner', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/platform/tenants/${newShopId}/reset-password`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.temporaryPassword).toBeDefined();
      expect(res.body.data.temporaryPassword.length).toBeGreaterThanOrEqual(10);
      tempPass = res.body.data.temporaryPassword;
    });

    it('Shop Owner can log in with Super Admin issued temporary password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'vikram@mehtalaundry.in',
          password: tempPass,
        })
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('Super Admin can impersonate shop and obtain delegated support session token', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/platform/tenants/${newShopId}/impersonate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.impersonatedBy).toBeDefined();
      expect(res.body.data.tenant.name).toBe('Mehta Express Laundry Hub');

      // Impersonated token can query /api/auth/me
      const meRes = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${res.body.data.accessToken}`)
        .expect(HttpStatus.OK);

      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.tenant.id).toBe(newShopId);
    });

    it('Partner Admin is forbidden from using Super Admin impersonation endpoint', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/platform/tenants/${newShopId}/impersonate`)
        .set('Authorization', `Bearer ${partnerAToken}`);

      expect(res.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('Suspended shop cannot log in', async () => {
      // Suspend tenant via Super Admin
      await request(app.getHttpServer())
        .post(`/api/platform/tenants/${newShopId}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ reason: 'Audit suspension test' })
        .expect(HttpStatus.OK);

      // Attempt login
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'vikram@mehtalaundry.in',
          password: tempPass,
        });

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
