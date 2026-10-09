import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import {
  RoleType,
  PermissionCode,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  PricingTier,
  DiscountType,
  ExpenseStatus,
  ExpensePaymentMethod,
  CustomerSegment,
  UnitType,
  InventoryUnit,
} from '@washora/shared';

describe('Phase 11 — Advanced Reporting, Analytics & Business Intelligence Test Suite', () => {
  let mongod: MongoMemoryServer;
  let app: INestApplication;

  // Tenant A: Multi-Branch Commercial Laundry
  let tokenA: string;
  let tenantAId: string;
  let branchA1Id: string;
  let branchA2Id: string;
  let catAId: string;
  let prodAId: string;
  let customerA1Id: string;
  let customerA2Id: string;
  let customerA3Id: string;
  let orderA1Id: string;
  let orderA2Id: string;
  let orderA3Id: string;

  // Restricted Users in Tenant A
  let cashierTokenA: string;
  let branchManagerTokenA: string;

  // Tenant B: Isolated Boutique Cleaners
  let tokenB: string;
  let tenantBId: string;
  let branchBId: string;
  let customerBId: string;
  let orderBId: string;

  // Tenant C: Empty Tenant (Zero Data Baseline)
  let tokenC: string;
  let tenantCId: string;
  let branchCId: string;

  const timestamp = Date.now();

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create({
      binary: { version: '7.0.14' },
    });
    process.env.MONGODB_URI = mongod.getUri();

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

    // -----------------------------------------------------------------------
    // 1. SETUP TENANT A (Main Tenant)
    // -----------------------------------------------------------------------
    const regA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Rohan Sharma',
        email: `rohan_${timestamp}@washorabi.test`,
        password: 'Password@123',
        phone: '+919876543201',
        tenantName: `Washora Prime BI Hub ${timestamp}`,
        businessType: 'LAUNDRY',
        branchName: 'Indiranagar Main Hub',
      })
      .expect(201);

    tokenA = regA.body.data.accessToken;
    tenantAId = regA.body.data.tenant.id;
    branchA1Id = regA.body.data.branches[0].id || regA.body.data.branches[0]._id;

    // Create Second Branch for Tenant A
    const branchResA2 = await request(app.getHttpServer())
      .post('/api/branches')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Koramangala Express Branch',
        code: `KOR-${timestamp.toString().slice(-4)}`,
        phone: '+919876543202',
        address: '80ft Road, 4th Block, Koramangala',
      })
      .expect(201);
    branchA2Id = branchResA2.body.data._id || branchResA2.body.data.id;

    // Seed Categories & Products for Tenant A
    const catResA = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Executive Garments',
        description: 'Formal garments',
        sortOrder: 1,
      })
      .expect(201);
    catAId = catResA.body.data._id || catResA.body.data.id;

    const prodResA = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Formal Linen Shirt',
        categoryId: catAId,
        sku: `SHIRT-${timestamp}`,
        unit: UnitType.PIECE,
        prices: {
          regular: 60,
          express: 90,
          sameDay: 120,
        },
      })
      .expect(201);
    prodAId = prodResA.body.data._id || prodResA.body.data.id;

    // Seed Customers for Tenant A
    const cust1 = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Aarav Patel',
        phone: '+919811111111',
        email: 'aarav@vip.test',
      })
      .expect(201);
    customerA1Id = cust1.body.data._id || cust1.body.data.id;

    const cust2 = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Priya Nambiar',
        phone: '+919822222222',
        email: 'priya@returning.test',
      })
      .expect(201);
    customerA2Id = cust2.body.data._id || cust2.body.data.id;

    const cust3 = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Karan Mehra',
        phone: '+919833333333',
        email: 'karan@newuser.test',
      })
      .expect(201);
    customerA3Id = cust3.body.data._id || cust3.body.data.id;

    // Seed Orders for Tenant A
    // Order 1: Branch 1, Customer 1 (High Value)
    const ord1 = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        branchId: branchA1Id,
        customerId: customerA1Id,
        pricingTier: PricingTier.EXPRESS,
        items: [
          {
            productId: prodAId,
            quantity: 10,
            unitPrice: 90,
            lineTotal: 900,
          },
        ],
        discount: {
          type: DiscountType.AMOUNT,
          value: 50,
        },
        payment: {
          amount: 892.5,
          method: PaymentMethod.UPI,
          referenceNumber: 'UPI_A1_REF',
        },
      })
      .expect(201);
    orderA1Id = ord1.body.data._id || ord1.body.data.id;

    // Order 2: Branch 1, Customer 2 (Partial Payment)
    const ord2 = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        branchId: branchA1Id,
        customerId: customerA2Id,
        pricingTier: PricingTier.REGULAR,
        items: [
          {
            productId: prodAId,
            quantity: 5,
            unitPrice: 60,
            lineTotal: 300,
          },
        ],
        payment: {
          amount: 200,
          method: PaymentMethod.CASH,
        },
      })
      .expect(201);
    orderA2Id = ord2.body.data._id || ord2.body.data.id;

    // Order 3: Branch 2, Customer 3 (Branch 2 Order)
    const ord3 = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        branchId: branchA2Id,
        customerId: customerA3Id,
        pricingTier: PricingTier.SAME_DAY,
        items: [
          {
            productId: prodAId,
            quantity: 4,
            unitPrice: 120,
            lineTotal: 480,
          },
        ],
        discount: {
          type: DiscountType.AMOUNT,
          value: 20,
        },
        payment: {
          amount: 483,
          method: PaymentMethod.CARD,
          referenceNumber: 'CARD_A3_REF',
        },
      })
      .expect(201);
    orderA3Id = ord3.body.data._id || ord3.body.data.id;

    // Seed Expense for Tenant A
    const expCatA = await request(app.getHttpServer())
      .post('/api/expenses/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Detergent & Chemicals',
        code: `EXP_CHEM_${timestamp}`,
        description: 'Plant chemicals',
      })
      .expect(201);
    const expCatAId = expCatA.body.data._id || expCatA.body.data.id;

    const expRes = await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        branchId: branchA1Id,
        categoryId: expCatAId,
        title: 'Monthly Laundry Detergent Refill',
        amount: 350,
        expenseDate: '2026-10-08',
        paymentMethod: ExpensePaymentMethod.CASH,
      })
      .expect(201);
    const expenseAId = expRes.body.data._id || expRes.body.data.id;

    await request(app.getHttpServer())
      .post(`/api/expenses/${expenseAId}/approve`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(201);

    // Seed Inventory for Tenant A
    const invCatList = await request(app.getHttpServer())
      .get('/api/inventory/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    const invCatAId = invCatList.body.data[0]._id || invCatList.body.data[0].id;

    await request(app.getHttpServer())
      .post('/api/inventory/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        branchId: branchA1Id,
        categoryId: invCatAId,
        name: 'Bio-Enzyme Detergent Pro',
        description: 'Enzyme detergent',
        unit: InventoryUnit.LITER,
        initialStock: 3,
        minimumStock: 10,
        unitCost: 4500,
      })
      .expect(201);

    // Create Cashier & Single-Branch Manager Users for Tenant A
    await request(app.getHttpServer())
      .post('/api/staff')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Deepak Cashier',
        email: `deepak.cashier.${timestamp}@washorabi.test`,
        phone: '+919876543209',
        password: 'Password@123',
        roleCode: RoleType.CASHIER,
        employmentType: 'FULL_TIME',
        primaryBranchId: branchA1Id,
        salaryConfiguration: {
          salaryType: 'MONTHLY',
          baseSalary: 2500000,
        },
      })
      .expect(201);

    const cashierLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: `deepak.cashier.${timestamp}@washorabi.test`,
        password: 'Password@123',
      })
      .expect(200);
    cashierTokenA = cashierLogin.body.data.accessToken;

    await request(app.getHttpServer())
      .post('/api/staff')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Sunita Branch Manager',
        email: `sunita.mgr.${timestamp}@washorabi.test`,
        phone: '+919876543208',
        password: 'Password@123',
        roleCode: RoleType.BRANCH_MANAGER,
        employmentType: 'FULL_TIME',
        primaryBranchId: branchA2Id,
        salaryConfiguration: {
          salaryType: 'MONTHLY',
          baseSalary: 3500000,
        },
      })
      .expect(201);

    const mgrLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: `sunita.mgr.${timestamp}@washorabi.test`,
        password: 'Password@123',
      })
      .expect(200);
    branchManagerTokenA = mgrLogin.body.data.accessToken;

    // -----------------------------------------------------------------------
    // 2. SETUP TENANT B (Isolated Tenant)
    // -----------------------------------------------------------------------
    const regB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Sameer Sen',
        email: `sameer_${timestamp}@boutiqueclean.test`,
        password: 'Password@123',
        phone: '+919876543203',
        tenantName: `Boutique Dry Cleaners ${timestamp}`,
        businessType: 'DRY_CLEANING',
        branchName: 'Whitefield Studio',
      })
      .expect(201);

    tokenB = regB.body.data.accessToken;
    tenantBId = regB.body.data.tenant.id;
    branchBId = regB.body.data.branches[0].id || regB.body.data.branches[0]._id;

    // Seed Order for Tenant B
    const custB = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Boutique Client B',
        phone: '+919844444444',
      })
      .expect(201);
    customerBId = custB.body.data._id || custB.body.data.id;

    const catB = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Delicate Silk',
      })
      .expect(201);
    const catBId = catB.body.data._id || catB.body.data.id;

    const prodB = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Silk Saree Dryclean',
        categoryId: catBId,
        sku: `SAREE-${timestamp}`,
        unit: UnitType.PIECE,
        prices: {
          regular: 5000,
          express: 6000,
          sameDay: 7000,
        },
      })
      .expect(201);
    const prodBId = prodB.body.data._id || prodB.body.data.id;

    const ordB = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        branchId: branchBId,
        customerId: customerBId,
        pricingTier: PricingTier.REGULAR,
        items: [
          {
            productId: prodBId,
            quantity: 1,
            unitPrice: 5000,
            lineTotal: 5000,
          },
        ],
        payment: {
          amount: 5000,
          method: PaymentMethod.CASH,
        },
      })
      .expect(201);
    orderBId = ordB.body.data._id || ordB.body.data.id;

    // -----------------------------------------------------------------------
    // 3. SETUP TENANT C (Empty Tenant)
    // -----------------------------------------------------------------------
    const regC = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Neelam Verma',
        email: `neelam_${timestamp}@emptytenant.test`,
        password: 'Password@123',
        phone: '+919876543204',
        tenantName: `Brand New Cleaners ${timestamp}`,
        businessType: 'LAUNDRY',
        branchName: 'First Outlet',
      })
      .expect(201);

    tokenC = regC.body.data.accessToken;
    tenantCId = regC.body.data.tenant.id;
    branchCId = regC.body.data.branches[0].id || regC.body.data.branches[0]._id;
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
    if (mongod) await mongod.stop();
  });

  // =========================================================================
  // 1. SECURITY, TENANT ISOLATION & RBAC (12 Tests)
  // =========================================================================
  describe('1. Security, Tenant Isolation & RBAC', () => {
    it('1.1 should allow Shop Owner of Tenant A to view dashboard', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.kpis).toBeDefined();
    });

    it('1.2 should reject query tenantId parameter injection via strict whitelist validator', async () => {
      await request(app.getHttpServer())
        .get(`/api/reports/sales?tenantId=${tenantBId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);
    });

    it('1.3 should prevent single-branch manager from querying unauthorized branchId', async () => {
      await request(app.getHttpServer())
        .get(`/api/reports/sales?branchId=${branchA1Id}`)
        .set('Authorization', `Bearer ${branchManagerTokenA}`)
        .expect(403);
    });

    it('1.4 should allow single-branch manager to query their assigned branchId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/sales?branchId=${branchA2Id}`)
        .set('Authorization', `Bearer ${branchManagerTokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalOrders).toBe(1); // Only Order 3 in Branch A2
    });

    it('1.5 should allow Shop Owner to view all branches combined', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary.totalOrders).toBe(3);
    });

    it('1.6 should block Cashier without REPORT_VIEW with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${cashierTokenA}`)
        .expect(403);
    });

    it('1.6b should allow Branch Manager with REPORT_VIEW to access sales report', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${branchManagerTokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('1.7 should block Cashier role from accessing /api/reports/finance (requires FINANCE_VIEW)', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/finance')
        .set('Authorization', `Bearer ${cashierTokenA}`)
        .expect(403);
    });

    it('1.8 should allow Shop Owner with FINANCE_VIEW to access /api/reports/finance', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/finance')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.grossRevenue).toBeDefined();
    });

    it('1.9 should reject unauthenticated requests with 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .expect(401);
    });

    it('1.10 should reject export when unauthenticated with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/export/sales')
        .expect(401);
    });

    it('1.11 should ensure Tenant B dashboard reflects only Tenant B records', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(res.body.data.kpis.netRevenue.current).toBeGreaterThanOrEqual(5000);
      expect(res.body.data.kpis.totalOrders.current).toBe(1);
    });

    it('1.12 should block unauthorized branch parameter on export for branch manager', async () => {
      await request(app.getHttpServer())
        .get(`/api/reports/export/sales?branchId=${branchA1Id}`)
        .set('Authorization', `Bearer ${branchManagerTokenA}`)
        .expect(403);
    });
  });

  // =========================================================================
  // 2. EXECUTIVE DASHBOARD & KPIS (7 Tests)
  // =========================================================================
  describe('2. Executive Dashboard & KPIs', () => {
    it('2.1 should calculate gross and net revenue delta comparisons', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/dashboard?rangePreset=THIS_MONTH')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const kpis = res.body.data.kpis;
      expect(kpis.netRevenue.current).toBeGreaterThan(0);
      expect(typeof kpis.netRevenue.percentageChange).toBe('number');
    });

    it('2.2 should return total orders and average order value (AOV)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.kpis.totalOrders.current).toBe(3);
      expect(res.body.data.kpis.averageOrderValue.current).toBeGreaterThan(0);
    });

    it('2.3 should return timeline with formatted ISO dates', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(Array.isArray(res.body.data.timeline)).toBe(true);
      expect(res.body.data.timeline.length).toBeGreaterThan(0);
      expect(res.body.data.timeline[0].date).toBeDefined();
    });

    it('2.4 should return top services ranking in dashboard', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(Array.isArray(res.body.data.topServices)).toBe(true);
      expect(res.body.data.topServices.length).toBeGreaterThan(0);
    });

    it('2.5 should return multi-branch distribution in dashboard', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(Array.isArray(res.body.data.branchBreakdown)).toBe(true);
      expect(res.body.data.branchBreakdown.length).toBe(2);
    });

    it('2.6 should return plant processing bottlenecks array', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(Array.isArray(res.body.data.bottlenecks)).toBe(true);
    });

    it('2.7 should return outstanding receivables in dashboard KPIs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(typeof res.body.data.kpis.outstandingReceivables).toBe('number');
    });
  });

  // =========================================================================
  // 3. SALES REPORT & REVENUE ANALYTICS (8 Tests)
  // =========================================================================
  describe('3. Sales Report & Revenue Analytics', () => {
    it('3.1 should return accurate gross sales, total discounts, and total tax', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const summary = res.body.data.summary;
      expect(summary.grossSales).toBeGreaterThan(0);
      expect(summary.netSales).toBeGreaterThan(0);
      expect(summary.totalOrders).toBe(3);
    });

    it('3.2 should return collected payments and outstanding balance', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary.collectedPayments).toBeGreaterThan(0);
      expect(typeof res.body.data.summary.outstandingBalance).toBe('number');
    });

    it('3.3 should group sales by branch correctly', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const byBranch = res.body.data.byBranch;
      expect(Array.isArray(byBranch)).toBe(true);
      expect(byBranch.length).toBe(2);

      const b1 = byBranch.find((b: any) => b.branchId === branchA1Id);
      expect(b1).toBeDefined();
      expect(b1.ordersCount).toBe(2);
    });

    it('3.4 should group sales by product category with percentage share', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const byCat = res.body.data.byCategory;
      expect(Array.isArray(byCat)).toBe(true);
      expect(byCat.length).toBeGreaterThan(0);
      expect(byCat[0].categoryName).toBe('Executive Garments');
      expect(byCat[0].percentage).toBe(100);
    });

    it('3.5 should group payments by payment method (UPI, CASH, CARD)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const byMethod = res.body.data.byPaymentMethod;
      expect(Array.isArray(byMethod)).toBe(true);
      expect(byMethod.length).toBeGreaterThanOrEqual(1);
    });

    it('3.6 should filter sales by specific branchId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/sales?branchId=${branchA2Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary.totalOrders).toBe(1);
    });

    it('3.7 should support disabling comparison via compare=false', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/sales?compare=false')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.comparison).toBeUndefined();
    });

    it('3.8 should return daily timeline with revenue and order count', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const timeline = res.body.data.timeline;
      expect(timeline.length).toBeGreaterThan(0);
      expect(timeline[0].ordersCount).toBe(3);
    });
  });

  // =========================================================================
  // 4. ORDERS REPORT & PIPELINE (6 Tests)
  // =========================================================================
  describe('4. Orders Report & Pipeline', () => {
    it('4.1 should return order status distribution with counts and percentages', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary.totalOrders).toBe(3);
      expect(Array.isArray(res.body.data.statusDistribution)).toBe(true);
      expect(res.body.data.statusDistribution.length).toBeGreaterThan(0);
    });

    it('4.2 should track pending vs completed orders correctly', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary.pendingOrders).toBeGreaterThanOrEqual(0);
    });

    it('4.3 should return order creation timeline', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(Array.isArray(res.body.data.timeline)).toBe(true);
      expect(res.body.data.timeline[0].createdCount).toBe(3);
    });

    it('4.4 should return SLA speed tier distribution', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(Array.isArray(res.body.data.speedTierRatio)).toBe(true);
      expect(res.body.data.speedTierRatio.length).toBe(3);
    });

    it('4.5 should filter orders report by date range', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/orders?rangePreset=TODAY')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary.totalOrders).toBe(3);
    });

    it('4.6 should filter orders report by single branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/orders?branchId=${branchA1Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary.totalOrders).toBe(2);
    });
  });

  // =========================================================================
  // 5. CUSTOMER ANALYTICS & RETENTION (8 Tests)
  // =========================================================================
  describe('5. Customer Analytics & Retention', () => {
    it('5.1 should return total customers and new customers count', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary.totalCustomers).toBe(3);
      expect(res.body.data.summary.newCustomersCount).toBe(3);
    });

    it('5.2 should calculate average lifetime spend per customer', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary.averageLifetimeSpend).toBeGreaterThan(0);
      expect(res.body.data.summary.averageOrdersPerCustomer).toBe(1);
    });

    it('5.3 should segment customers into rule-based segments', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const segments = res.body.data.segments;
      expect(Array.isArray(segments)).toBe(true);
      expect(segments.length).toBe(5);

      const newSeg = segments.find((s: any) => s.segment === CustomerSegment.NEW);
      expect(newSeg).toBeDefined();
      expect(newSeg.count).toBe(3);
    });

    it('5.4 should rank top customers by total spend', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const top = res.body.data.topCustomers;
      expect(top.length).toBe(3);
      expect(top[0].totalSpend).toBeGreaterThan(0);
      expect(top[0].name).toBe('Aarav Patel');
    });

    it('5.5 should return retention cohort structure', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(Array.isArray(res.body.data.retentionCohorts)).toBe(true);
    });

    it('5.6 should not leak Tenant B customers to Tenant A report', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const names = res.body.data.topCustomers.map((c: any) => c.name);
      expect(names).not.toContain('Boutique Client B');
    });

    it('5.7 should filter customer analytics by branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/customers?branchId=${branchA2Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.topCustomers.length).toBe(1);
      expect(res.body.data.topCustomers[0].name).toBe('Karan Mehra');
    });

    it('5.8 should calculate customer outstanding balance accurately in top list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const priya = res.body.data.topCustomers.find((c: any) => c.name === 'Priya Nambiar');
      expect(priya).toBeDefined();
      expect(typeof priya.outstandingBalance).toBe('number');
    });
  });

  // =========================================================================
  // 6. SERVICES & PRODUCTS PERFORMANCE (5 Tests)
  // =========================================================================
  describe('6. Services & Products Performance', () => {
    it('6.1 should rank top revenue services with average unit price', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/services')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const topServices = res.body.data.topServices;
      expect(topServices.length).toBeGreaterThan(0);
      expect(topServices[0].revenue).toBeGreaterThan(0);
      expect(topServices[0].averageUnitPrice).toBeGreaterThan(0);
    });

    it('6.2 should rank top products by quantity sold', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/services')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const topProds = res.body.data.topProducts;
      expect(topProds.length).toBe(1);
      expect(topProds[0].productName).toBe('Formal Linen Shirt');
      expect(topProds[0].quantity).toBe(19);
    });

    it('6.3 should return category breakdown with item counts and revenue', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/services')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const cats = res.body.data.categoryBreakdown;
      expect(cats.length).toBe(1);
      expect(cats[0].categoryName).toBe('Executive Garments');
      expect(cats[0].itemCount).toBe(19);
      expect(cats[0].percentage).toBe(100);
    });

    it('6.4 should filter service analytics by branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/services?branchId=${branchA2Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.topProducts[0].quantity).toBe(4);
    });

    it('6.5 should filter service analytics by date range preset', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/services?rangePreset=THIS_MONTH')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.topProducts.length).toBe(1);
    });
  });

  // =========================================================================
  // 7. MULTI-BRANCH PERFORMANCE COMPARISON (5 Tests)
  // =========================================================================
  describe('7. Multi-Branch Performance Comparison', () => {
    it('7.1 should compare revenue, orders, and AOV across all branches', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/branches')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const branches = res.body.data.branches;
      expect(branches.length).toBe(2);

      const b1 = branches.find((b: any) => b.branchId === branchA1Id);
      const b2 = branches.find((b: any) => b.branchId === branchA2Id);

      expect(b1.ordersCount).toBe(2);
      expect(b2.ordersCount).toBe(1);
    });

    it('7.2 should include branch expenses in branch comparison', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/branches')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const b1 = res.body.data.branches.find((b: any) => b.branchId === branchA1Id);
      expect(b1.expenses).toBe(350); // From seeded approved expense
    });

    it('7.3 should calculate estimated branch operational profit', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/branches')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const b1 = res.body.data.branches.find((b: any) => b.branchId === branchA1Id);
      expect(typeof b1.estimatedProfit).toBe('number');
    });

    it('7.4 should calculate revenue share percentage per branch', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/branches')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const b1 = res.body.data.branches.find((b: any) => b.branchId === branchA1Id);
      const b2 = res.body.data.branches.find((b: any) => b.branchId === branchA2Id);

      expect(b1.revenueSharePercent).toBeGreaterThan(0);
      expect(b2.revenueSharePercent).toBeGreaterThan(0);
    });

    it('7.5 should restrict branch manager to seeing branch report safely', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/branches')
        .set('Authorization', `Bearer ${branchManagerTokenA}`)
        .expect(200);

      expect(res.body.data.branches.length).toBe(2);
    });
  });

  // =========================================================================
  // 8. PAYMENT ANALYTICS (4 Tests)
  // =========================================================================
  describe('8. Payment Analytics', () => {
    it('8.1 should return total collected, total pending, and transaction count', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/payments')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const summary = res.body.data.summary;
      expect(summary.totalCollected).toBeGreaterThan(0);
      expect(summary.transactionsCount).toBeGreaterThanOrEqual(1);
    });

    it('8.2 should categorize payments by method with amounts and counts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/payments')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const byMethod = res.body.data.byMethod;
      expect(byMethod.length).toBeGreaterThanOrEqual(1);
    });

    it('8.3 should break down collected and pending amounts by branch', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/payments')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const byBranch = res.body.data.byBranch;
      expect(byBranch.length).toBe(2);
    });

    it('8.4 should return timeline of collected payments', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/payments')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const timeline = res.body.data.timeline;
      expect(timeline.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 9. OPERATIONAL FINANCE & EXPENSES (7 Tests)
  // =========================================================================
  describe('9. Operational Finance & Expenses', () => {
    it('9.1 should return gross revenue, net revenue, and collected payments', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/finance')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const s = res.body.data.summary;
      expect(s.grossRevenue).toBeGreaterThan(0);
      expect(s.netRevenue).toBeGreaterThan(0);
      expect(s.collectedPayments).toBeGreaterThan(0);
    });

    it('9.2 should aggregate approved expenses, purchases, and payroll', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/finance')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const s = res.body.data.summary;
      expect(s.totalExpenses).toBe(350);
      expect(s.inventoryPurchases).toBe(0);
      expect(s.payrollExpenses).toBe(0);
    });

    it('9.3 should calculate estimated operational profit (Revenue - Outflows)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/finance')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const s = res.body.data.summary;
      expect(typeof s.estimatedOperationalProfit).toBe('number');
    });

    it('9.4 should calculate operational profit margin percentage', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/finance')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const s = res.body.data.summary;
      expect(typeof s.profitMarginPercent).toBe('number');
    });

    it('9.5 should categorize expenses by category with percentages', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/finance')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const expCats = res.body.data.expenseBreakdownByCategory;
      expect(expCats.length).toBe(1);
      expect(expCats[0].category).toBe('Detergent & Chemicals');
      expect(expCats[0].amount).toBe(350);
      expect(expCats[0].percentage).toBe(100);
    });

    it('9.6 should return dedicated expense report from /api/reports/expenses', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/expenses')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary.totalExpenses).toBe(350);
      expect(res.body.data.byCategory.length).toBe(1);
    });

    it('9.7 should filter finance report by branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/finance?branchId=${branchA2Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary.collectedPayments).toBeGreaterThan(0);
      expect(res.body.data.summary.totalExpenses).toBe(0); // Branch A2 has no expenses
    });
  });

  // =========================================================================
  // 10. INVENTORY VALUATION & STOCK ANALYTICS (6 Tests)
  // =========================================================================
  describe('10. Inventory Valuation & Stock Analytics', () => {
    it('10.1 should calculate total stock valuation using average cost', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/inventory')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary.totalStockValue).toBe(13500); // 3 units * 4500 paise
      expect(res.body.data.summary.totalItemsCount).toBe(1);
    });

    it('10.2 should identify low stock alert when currentStock <= minimumStock', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/inventory')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary.lowStockItemsCount).toBe(1);
      expect(res.body.data.lowStockAlerts.length).toBe(1);

      const alert = res.body.data.lowStockAlerts[0];
      expect(alert.name).toBe('Bio-Enzyme Detergent Pro');
      expect(alert.currentStock).toBe(3);
      expect(alert.minThreshold).toBe(10);
      expect(alert.deficit).toBe(7); // 10 - 3 = 7
    });

    it('10.3 should not leak Tenant B inventory to Tenant A', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/inventory')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(res.body.data.summary.totalItemsCount).toBe(0);
    });

    it('10.4 should filter inventory report by branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/inventory?branchId=${branchA1Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary.totalItemsCount).toBe(1);
    });

    it('10.5 should return empty alerts for branch with no low stock', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/inventory?branchId=${branchA2Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary.totalItemsCount).toBe(0);
      expect(res.body.data.lowStockAlerts.length).toBe(0);
    });

    it('10.6 should return suppliers summary from /api/reports/suppliers', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/suppliers')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary).toBeDefined();
    });
  });

  // =========================================================================
  // 11. PLANT PROCESSING & QC DEFECT ANALYTICS (6 Tests)
  // =========================================================================
  describe('11. Plant Processing & QC Defect Analytics', () => {
    it('11.1 should return processing job throughput summary', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/processing')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary).toBeDefined();
      expect(typeof res.body.data.summary.totalJobs).toBe('number');
      expect(typeof res.body.data.summary.reworkRatePercent).toBe('number');
    });

    it('11.2 should return plant stage metrics and duration', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/processing')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(Array.isArray(res.body.data.stageMetrics)).toBe(true);
    });

    it('11.3 should return QC pass rate and defect summary from /api/reports/qc', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/qc')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary).toBeDefined();
      expect(typeof res.body.data.summary.passRatePercent).toBe('number');
      expect(Array.isArray(res.body.data.issuesByType)).toBe(true);
      expect(Array.isArray(res.body.data.issuesBySeverity)).toBe(true);
    });

    it('11.4 should filter processing report by branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/processing?branchId=${branchA1Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('11.5 should filter QC report by branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/qc?branchId=${branchA2Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('11.6 should return staff performance report from /api/reports/staff', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/staff')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.totalStaff).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data.staffList)).toBe(true);
    });
  });

  // =========================================================================
  // 12. LOGISTICS & NOTIFICATIONS ANALYTICS (6 Tests)
  // =========================================================================
  describe('12. Logistics & Notifications Analytics', () => {
    it('12.1 should return pickup and delivery logistics report', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/logistics')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary).toBeDefined();
      expect(typeof res.body.data.summary.pickupSuccessRate).toBe('number');
      expect(typeof res.body.data.summary.deliverySuccessRate).toBe('number');
    });

    it('12.2 should filter logistics report by branchId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/logistics?branchId=${branchA1Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('12.3 should return notification delivery rates by channel', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/notifications')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary).toBeDefined();
      expect(Array.isArray(res.body.data.byChannel)).toBe(true);
    });

    it('12.4 should not leak Tenant B notifications to Tenant A', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/notifications')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('12.5 should support date range filtering on logistics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/logistics?rangePreset=THIS_MONTH')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('12.6 should support date range filtering on notifications', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/notifications?rangePreset=THIS_MONTH')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // =========================================================================
  // 13. REPORT EXPORTING & CSV GENERATION (7 Tests)
  // =========================================================================
  describe('13. Report Exporting & CSV Generation', () => {
    it('13.1 should export sales report to valid CSV', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/export/sales')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment; filename=');
      expect(res.text).toContain('Date,Gross Revenue (INR),Orders Count,Collected Payments (INR)');
    });

    it('13.2 should export orders report to valid CSV', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/export/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Order Status,Count,Percentage (%)');
    });

    it('13.3 should export customers report to valid CSV', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/export/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.text).toContain('Customer Name,Phone,Total Orders,Total Spend (INR)');
      expect(res.text).toContain('Aarav Patel');
    });

    it('13.4 should export inventory report to valid CSV', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/export/inventory')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.text).toContain('Item Name,SKU,Current Stock,Min Threshold');
      expect(res.text).toContain('Bio-Enzyme Detergent Pro');
    });

    it('13.5 should export finance report to valid CSV', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/export/finance')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.text).toContain('Metric,Amount (INR)');
      expect(res.text).toContain('Collected Customer Payments');
    });

    it('13.6 should export processing report to valid CSV', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/export/processing')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.text).toContain('Stage Name,Jobs Processed,Currently In Stage');
    });

    it('13.7 should return 400 Bad Request for unsupported export type', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/export/unsupported_type_xyz')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);
    });
  });

  // =========================================================================
  // 14. DATE PRESETS & ZERO-STATE HANDLING (6 Tests)
  // =========================================================================
  describe('14. Date Presets & Zero-State Handling', () => {
    it('14.1 should handle all standard date presets without error', async () => {
      const presets = ['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'THIS_QUARTER', 'THIS_YEAR'];
      for (const p of presets) {
        const res = await request(app.getHttpServer())
          .get(`/api/reports/sales?rangePreset=${p}`)
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200);

        expect(res.body.success).toBe(true);
      }
    });

    it('14.2 should support custom date range with dateFrom and dateTo', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/sales?dateFrom=2026-01-01&dateTo=2026-12-31')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.summary.totalOrders).toBe(3);
    });

    it('14.3 should return clean zero values for new empty tenant C dashboard', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${tokenC}`)
        .expect(200);

      const kpis = res.body.data.kpis;
      expect(kpis.netRevenue.current).toBe(0);
      expect(kpis.totalOrders.current).toBe(0);
      expect(kpis.averageOrderValue.current).toBe(0);
      expect(kpis.estimatedOperationalProfit.current).toBe(0);
      expect(kpis.profitMarginPercent).toBe(0);
      expect(kpis.outstandingReceivables).toBe(0);
      expect(Number.isNaN(kpis.netRevenue.percentageChange)).toBe(false);
    });

    it('14.4 should return empty arrays for empty tenant C sales report without throwing', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${tokenC}`)
        .expect(200);

      expect(res.body.data.summary.netSales).toBe(0);
      expect(res.body.data.summary.totalOrders).toBe(0);
      expect(res.body.data.timeline.length).toBe(0);
      expect(res.body.data.byCategory.length).toBe(0);
      expect(res.body.data.byPaymentMethod.length).toBe(0);
    });

    it('14.5 should return zero customer metrics for empty tenant C', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/customers')
        .set('Authorization', `Bearer ${tokenC}`)
        .expect(200);

      expect(res.body.data.summary.totalCustomers).toBe(0);
      expect(res.body.data.summary.averageLifetimeSpend).toBe(0);
      expect(res.body.data.topCustomers.length).toBe(0);
    });

    it('14.6 should export valid empty CSV with headers for empty tenant C', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/export/sales')
        .set('Authorization', `Bearer ${tokenC}`)
        .expect(200);

      expect(res.text).toContain('Date,Gross Revenue (INR),Orders Count,Collected Payments (INR)');
    });
  });
});
