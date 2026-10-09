import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { BusinessType, RoleType, UnitType } from '@washora/shared';

describe('Phase 02 — Multi-Tenant Security & Isolation Matrix (Step 35)', () => {
  let mongod: MongoMemoryServer;
  let app: INestApplication;
  let tenantA: any;
  let tenantB: any;
  let tokenA: string;
  let tokenB: string;
  let categoryAId: string;
  let productAId: string;
  let cashierToken: string;
  let operatorToken: string;
  let branchAId: string;
  let branchBId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create({
      binary: { version: '7.0.14' },
    });
    process.env.MONGODB_URI = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health'] });
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

    const timestamp = Date.now();

    // Register Tenant A (Owner)
    const resA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: `Owner Alpha ${timestamp}`,
        email: `alpha_${timestamp}@washora.test`,
        password: 'Password@123',
        phone: '+919876500001',
        tenantName: `Alpha Laundry ${timestamp}`,
        businessType: BusinessType.LAUNDRY,
        branchName: 'Alpha Flagship Hub',
        branchCity: 'Bengaluru',
      });

    tenantA = resA.body.data;
    tokenA = tenantA.accessToken;
    branchAId = tenantA.branches[0].id;

    // Register Tenant B (Owner)
    const resB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: `Owner Beta ${timestamp}`,
        email: `beta_${timestamp}@washora.test`,
        password: 'Password@123',
        phone: '+919876500002',
        tenantName: `Beta DryCleaners ${timestamp}`,
        businessType: BusinessType.DRY_CLEANING,
        branchName: 'Beta Main Branch',
        branchCity: 'Mumbai',
      });

    tenantB = resB.body.data;
    tokenB = tenantB.accessToken;
    branchBId = tenantB.branches[0].id;

    // Create Category in Tenant A
    const catRes = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: `Alpha Luxury Wear ${timestamp}`,
        description: 'Silk and delicate fabrics',
        icon: 'Sparkles',
        color: '#8B5CF6',
      });
    categoryAId = catRes.body.data.id || catRes.body.data._id;

    // Create Product in Tenant A
    const prodRes = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Silk Designer Saree',
        categoryId: categoryAId,
        sku: `SKU-SAREE-${timestamp}`,
        unit: UnitType.PIECE,
        prices: {
          regular: 250,
          express: 350,
          sameDay: 450,
        },
      });
    productAId = prodRes.body.data.id || prodRes.body.data._id;

    // Invite Cashier to Tenant A
    const cashierRes = await request(app.getHttpServer())
      .post('/api/memberships/invite')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: `Cashier A ${timestamp}`,
        email: `cashier_${timestamp}@washora.test`,
        roleCode: RoleType.CASHIER,
        branchIds: [branchAId],
      });

    // Login as Cashier
    const cashierLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: `cashier_${timestamp}@washora.test`,
        password: 'Washora@2026',
      });
    cashierToken = cashierLogin.body.data.accessToken;

    // Invite Operator to Tenant A
    const operatorRes = await request(app.getHttpServer())
      .post('/api/memberships/invite')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: `Operator A ${timestamp}`,
        email: `operator_${timestamp}@washora.test`,
        roleCode: RoleType.OPERATOR,
        branchIds: [branchAId],
      });

    // Login as Operator
    const operatorLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: `operator_${timestamp}@washora.test`,
        password: 'Washora@2026',
      });
    operatorToken = operatorLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // Test 1: Tenant A cannot access Tenant B category
  it('Test 1: Tenant B cannot access Tenant A category', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/categories/${categoryAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // Test 2: Tenant B cannot access Tenant A product
  it('Test 2: Tenant B cannot access Tenant A product', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/products/${productAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // Test 3: Branch isolation - user assigned only to Branch A cannot access Branch B
  it('Test 3: Cashier assigned to Branch A cannot access Branch B', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/branches/${branchBId}`)
      .set('Authorization', `Bearer ${cashierToken}`);

    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  // Test 4: Cashier cannot modify restricted shop settings
  it('Test 4: Cashier cannot modify restricted settings (RBAC check)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/settings')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        invoicePrefix: 'HACKED-',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Test 5: Operator cannot create or modify products if permission is absent
  it('Test 5: Operator cannot create products without permission', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        name: 'Unauthorized Product',
        categoryId: categoryAId,
        unit: UnitType.PIECE,
        prices: { regular: 100, express: 150, sameDay: 200 },
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Test 6: Unauthenticated request receives 401
  it('Test 6: Unauthenticated request receives 401 Unauthorized', async () => {
    const res = await request(app.getHttpServer()).get('/api/products');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // Test 7: Authenticated user without permission receives 403 Forbidden
  it('Test 7: Authenticated user without permission receives 403 Forbidden', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        name: 'Forbidden Category',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Test 8: Invalid MongoDB IDs are handled safely (400 Bad Request)
  it('Test 8: Invalid MongoDB ID returns safe 400 or 404 without unhandled exception', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/products/invalid-non-hex-id-999')
      .set('Authorization', `Bearer ${tokenA}`);

    expect([400, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  // Test 9: Duplicate SKU within same tenant is rejected
  it('Test 9: Duplicate SKU within same tenant is rejected (409 Conflict)', async () => {
    const duplicateSku = `DUP-SKU-${Date.now()}`;

    // First product with SKU
    await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'First Item',
        categoryId: categoryAId,
        sku: duplicateSku,
        unit: UnitType.PIECE,
        prices: { regular: 100, express: 150, sameDay: 200 },
      });

    // Attempt second product with same SKU in Tenant A
    const res = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Second Item With Duplicate SKU',
        categoryId: categoryAId,
        sku: duplicateSku,
        unit: UnitType.PIECE,
        prices: { regular: 120, express: 180, sameDay: 240 },
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // Test 10: Same SKU can exist in different tenants
  it('Test 10: Same SKU can exist in different tenants without collision', async () => {
    const sharedSku = `CROSS-TENANT-SKU-${Date.now()}`;

    // Create Category in Tenant B first
    const catB = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Beta General',
      });
    const categoryBId = catB.body.data.id || catB.body.data._id;

    // Create product in Tenant A
    const resA = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Tenant A Suit',
        categoryId: categoryAId,
        sku: sharedSku,
        unit: UnitType.PIECE,
        prices: { regular: 300, express: 400, sameDay: 500 },
      });
    expect(resA.status).toBe(201);

    // Create product with same SKU in Tenant B
    const resB = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Tenant B Suit',
        categoryId: categoryBId,
        sku: sharedSku,
        unit: UnitType.PIECE,
        prices: { regular: 350, express: 450, sameDay: 550 },
      });
    expect(resB.status).toBe(201);
    expect(resB.body.success).toBe(true);
  });

  // Test Health Endpoint
  it('Health Check: GET /health returns ok with connected database', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.database).toBe('connected');
    expect(res.body.data.service).toBe('washora-api');
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongod) await mongod.stop();
  });
});
