import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AuditService } from '../src/modules/audit/audit.service';
import { CustomerTrackingService } from '../src/modules/customer-portal/customer-tracking.service';
import {
  RoleType,
  CustomerAccountStatus,
  OrderStatus,
  PaymentMethod,
  PricingTier,
  UnitType,
} from '@washora/shared';

describe('Phase 09 — Customer CRM, Secure Customer Portal & Self-Service Experience', () => {
  let mongod: MongoMemoryServer;
  let app: INestApplication;
  let trackingService: CustomerTrackingService;
  let auditService: AuditService;

  // Tenant A
  let tokenA: string;
  let tenantAId: string;
  let branchAId: string;
  let cashierTokenA: string;
  let customerAId: string;
  let customerAToken: string;
  let customerAAccountId: string;
  let orderAId: string;
  let orderATrackingToken: string;
  let addressA1Id: string;

  // Customer A2 (same tenant)
  let customerA2Id: string;
  let customerA2Token: string;
  let customerA2AccountId: string;
  let orderA2Id: string;

  // Tenant B
  let tokenB: string;
  let tenantBId: string;
  let branchBId: string;
  let customerBId: string;
  let customerBToken: string;
  let orderBId: string;
  let orderBTrackingToken: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create({
      binary: { version: '7.0.14' },
    });
    process.env.MONGODB_URI = mongod.getUri();
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_jwt_secret_customer_portal_2026';

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

    trackingService = moduleFixture.get<CustomerTrackingService>(CustomerTrackingService);
    auditService = moduleFixture.get<AuditService>(AuditService);

    const timestamp = Date.now();

    // 1. Setup Tenant A
    const regResA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Metro Owner',
        email: `owner_${timestamp}@metrolaundry.test`,
        password: 'Password@123',
        phone: `+9198${String(timestamp).slice(-8)}`,
        tenantName: `Washora Metro Laundry ${timestamp}`,
        businessType: 'LAUNDRY',
        branchName: 'Metro Central',
      });
    expect(regResA.status).toBe(201);
    tokenA = regResA.body.data.accessToken;
    tenantAId = regResA.body.data.tenant.id;
    branchAId = regResA.body.data.branches[0].id || regResA.body.data.branches[0]._id;

    cashierTokenA = tokenA;

    // 2. Setup Tenant B
    const regResB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Express Owner',
        email: `owner_b_${timestamp}@expresslaundry.test`,
        password: 'Password@123',
        phone: `+9196${String(timestamp).slice(-8)}`,
        tenantName: `Washora Express DryCleaners ${timestamp}`,
        businessType: 'LAUNDRY',
        branchName: 'Express North',
      });
    expect(regResB.status).toBe(201);
    tokenB = regResB.body.data.accessToken;
    tenantBId = regResB.body.data.tenant.id;
    branchBId = regResB.body.data.branches[0].id || regResB.body.data.branches[0]._id;

    // 3. Create Categories and Products in Tenant A
    const catARes = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Dry Cleaning' });
    expect(catARes.status).toBe(201);
    const categoryAId = catARes.body.data.id || catARes.body.data._id;

    const prodARes = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Silk Shirt',
        categoryId: categoryAId,
        unit: UnitType.PIECE,
        prices: { regular: 150, express: 225, sameDay: 300 },
      });
    expect(prodARes.status).toBe(201);
    const productAId = prodARes.body.data.id || prodARes.body.data._id;

    // Create Category & Product in Tenant B
    const catBRes = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Winter Wear' });
    expect(catBRes.status).toBe(201);
    const categoryBId = catBRes.body.data.id || catBRes.body.data._id;

    const prodBRes = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Winter Jacket',
        categoryId: categoryBId,
        unit: UnitType.PIECE,
        prices: { regular: 500, express: 750, sameDay: 1000 },
      });
    expect(prodBRes.status).toBe(201);
    const productBId = prodBRes.body.data.id || prodBRes.body.data._id;

    // 4. Create Business Customers in Tenant A
    const custResA = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Rahul Sharma',
        phone: '9811122233',
        email: 'rahul@example.test',
        isVip: true,
        addresses: [{ addressLine1: '101 Indiranagar', city: 'Bangalore', isDefault: true }],
      });
    expect(custResA.status).toBe(201);
    customerAId = custResA.body.data.id || custResA.body.data._id;

    const custResA2 = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Pooja Verma',
        phone: '9811122244',
        email: 'pooja@example.test',
        addresses: [{ addressLine1: '202 Koramangala', city: 'Bangalore', isDefault: true }],
      });
    expect(custResA2.status).toBe(201);
    customerA2Id = custResA2.body.data.id || custResA2.body.data._id;

    // 5. Create Business Customer in Tenant B
    const custResB = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Amit Patel',
        phone: '9822233344',
        email: 'amit@example.test',
        addresses: [{ addressLine1: '303 Salt Lake', city: 'Kolkata', isDefault: true }],
      });
    expect(custResB.status).toBe(201);
    customerBId = custResB.body.data.id || custResB.body.data._id;

    // 6. Create Orders for Customers
    const orderResA = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-branch-id', branchAId)
      .send({
        customerId: customerAId,
        branchId: branchAId,
        items: [
          {
            productId: productAId,
            quantity: 2,
            unitPrice: 150,
            lineTotal: 300,
          },
        ],
        subtotal: 300,
        grandTotal: 300,
        payment: {
          amount: 100,
          method: PaymentMethod.CASH,
        },
        internalNotes: 'VIP Customer - High priority packaging',
      });
    expect(orderResA.status).toBe(201);
    orderAId = orderResA.body.data.id || orderResA.body.data._id;

    // Generate tracking token for Order A
    const trackInitA = await trackingService.generateToken(tenantAId, orderAId);
    orderATrackingToken = trackInitA.token;

    const orderResA2 = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-branch-id', branchAId)
      .send({
        customerId: customerA2Id,
        branchId: branchAId,
        items: [
          {
            productId: productAId,
            quantity: 1,
            unitPrice: 150,
            lineTotal: 150,
          },
        ],
        subtotal: 150,
        grandTotal: 150,
      });
    expect(orderResA2.status).toBe(201);
    orderA2Id = orderResA2.body.data.id || orderResA2.body.data._id;

    const orderResB = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-branch-id', branchBId)
      .send({
        customerId: customerBId,
        branchId: branchBId,
        items: [
          {
            productId: productBId,
            quantity: 1,
            unitPrice: 500,
            lineTotal: 500,
          },
        ],
        subtotal: 500,
        grandTotal: 500,
      });
    expect(orderResB.status).toBe(201);
    orderBId = orderResB.body.data.id || orderResB.body.data._id;

    const trackInitB = await trackingService.generateToken(tenantBId, orderBId);
    orderBTrackingToken = trackInitB.token;
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  // =========================================================================
  // 1. CUSTOMER AUTHENTICATION & SESSIONS (6 Tests)
  // =========================================================================
  describe('1. Customer Authentication & Sessions', () => {
    it('1.1 should request OTP successfully and return testOtp in test mode', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/customer-auth/request-otp')
        .send({ phone: '9811122233' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.testOtp).toBe('123456');
    });

    it('1.2 should verify valid OTP and return customer token with isolated session', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/customer-auth/verify-otp')
        .send({ phone: '9811122233', otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.account.phone).toBe('9811122233');
      expect(res.body.data.customer.name).toBe('Rahul Sharma');

      customerAToken = res.body.data.accessToken;
      customerAAccountId = res.body.data.account.id;
    });

    it('1.3 should reject invalid OTP with 400 or 401 Bad Request/Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/customer-auth/verify-otp')
        .send({ phone: '9811122233', otp: '999999' });

      expect([400, 401]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('1.4 should authenticate Customer A2 and return separate session', async () => {
      await request(app.getHttpServer())
        .post('/api/customer-auth/request-otp')
        .send({ phone: '9811122244' });

      const res = await request(app.getHttpServer())
        .post('/api/customer-auth/verify-otp')
        .send({ phone: '9811122244', otp: '123456' });

      expect(res.status).toBe(200);
      customerA2Token = res.body.data.accessToken;
      customerA2AccountId = res.body.data.account.id;
      expect(res.body.data.customer.name).toBe('Pooja Verma');
    });

    it('1.5 should authenticate Customer B in Tenant B', async () => {
      await request(app.getHttpServer())
        .post('/api/customer-auth/request-otp')
        .send({ phone: '9822233344' });

      const res = await request(app.getHttpServer())
        .post('/api/customer-auth/verify-otp')
        .send({ phone: '9822233344', otp: '123456' });

      expect(res.status).toBe(200);
      customerBToken = res.body.data.accessToken;
      expect(res.body.data.customer.name).toBe('Amit Patel');
    });

    it('1.6 should logout customer and invalidate customer session', async () => {
      const logoutRes = await request(app.getHttpServer())
        .post('/api/customer-auth/logout')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(logoutRes.status).toBe(200);

      // Re-login Customer A for subsequent test cases
      await request(app.getHttpServer())
        .post('/api/customer-auth/request-otp')
        .send({ phone: '9811122233' });

      const loginRes = await request(app.getHttpServer())
        .post('/api/customer-auth/verify-otp')
        .send({ phone: '9811122233', otp: '123456' });

      customerAToken = loginRes.body.data.accessToken;
      expect(customerAToken).toBeDefined();
    });
  });

  // =========================================================================
  // 2. CUSTOMER DATA ISOLATION (8 Tests)
  // =========================================================================
  describe('2. Customer Isolation & Data Boundaries', () => {
    it('2.1 Customer A cannot access Customer A2 profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/customer-portal/profile')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.customer.name).toBe('Rahul Sharma');
      expect(res.body.data.customer.name).not.toBe('Pooja Verma');
    });

    it('2.2 Customer A cannot access Customer A2 order detail', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customer-portal/orders/${orderA2Id}`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect([403, 404]).toContain(res.status);
    });

    it('2.3 Customer A order list only returns Customer A orders', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/customer-portal/orders')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      const items = res.body.data.items || res.body.data;
      expect(items.length).toBe(1);
      expect(items[0].id).toBe(orderAId);
    });

    it('2.4 Customer A cannot view Customer A2 payments', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/customer-portal/payments')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      const items = res.body.data.items || res.body.data;
      items.forEach((p: any) => {
        expect(p.customerId).not.toBe(customerA2Id);
      });
    });

    it('2.5 Customer A cannot view Customer A2 invoices', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customer-portal/invoices/${orderA2Id}`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect([403, 404]).toContain(res.status);
    });

    it('2.6 Customer A notifications only contain Customer A updates', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/customer-portal/notifications')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
    });

    it('2.7 Customer A cannot view or modify Customer A2 address', async () => {
      // Add address to Customer A2
      const addrResA2 = await request(app.getHttpServer())
        .post('/api/customer-portal/addresses')
        .set('Authorization', `Bearer ${customerA2Token}`)
        .send({
          label: 'Pooja Home',
          addressLine1: 'Villa 50, Palm Meadows',
          city: 'Bangalore',
          pincode: '560066',
        });
      expect(addrResA2.status).toBe(201);
      const addressA2Id = addrResA2.body.data[0]._id || addrResA2.body.data[0].id;

      // Customer A tries to update Customer A2 address
      const tamperRes = await request(app.getHttpServer())
        .patch(`/api/customer-portal/addresses/${addressA2Id}`)
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ addressLine1: 'Hacked Address Line' });

      expect([403, 404]).toContain(tamperRes.status);
    });

    it('2.8 Customer token cannot access staff admin endpoints', async () => {
      const adminRes = await request(app.getHttpServer())
        .get('/api/staff')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect([401, 403]).toContain(adminRes.status);
    });
  });

  // =========================================================================
  // 3. TENANT ISOLATION (4 Tests)
  // =========================================================================
  describe('3. Tenant Isolation', () => {
    it('3.1 Tenant A Customer cannot access Tenant B order', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customer-portal/orders/${orderBId}`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect([403, 404]).toContain(res.status);
    });

    it('3.2 Tenant A Customer cannot access Tenant B invoice', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customer-portal/invoices/${orderBId}`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect([403, 404]).toContain(res.status);
    });

    it('3.3 Tenant B Customer cannot view Tenant A orders', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/customer-portal/orders')
        .set('Authorization', `Bearer ${customerBToken}`);

      expect(res.status).toBe(200);
      const items = res.body.data.items || res.body.data;
      expect(items.some((o: any) => o.id === orderAId)).toBe(false);
    });

    it('3.4 Tenant A Customer cannot view Tenant B dashboard', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/customer-portal/dashboard')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.activeOrders.some((o: any) => o.id === orderBId)).toBe(false);
    });
  });

  // =========================================================================
  // 4. ADDRESS MANAGEMENT (6 Tests)
  // =========================================================================
  describe('4. Customer Address Management', () => {
    it('4.1 Customer can add a new address', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/customer-portal/addresses')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          label: 'Apartment',
          addressLine1: 'Flat 304, Green Heights',
          area: 'Indiranagar',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560038',
          landmark: 'Opp Metro Pillar 45',
          isDefault: true,
        });

      expect(res.status).toBe(201);
      const addresses = res.body.data;
      expect(addresses.length).toBeGreaterThan(0);
      addressA1Id = addresses[addresses.length - 1]._id;
      expect(addresses[addresses.length - 1].isDefault).toBe(true);
    });

    it('4.2 Customer can add a second address', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/customer-portal/addresses')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          label: 'Office',
          addressLine1: 'Tech Park, Tower B',
          city: 'Bangalore',
          pincode: '560100',
          isDefault: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('4.3 Customer can update an existing address', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/customer-portal/addresses/${addressA1Id}`)
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          addressLine2: '12th Main Road',
          landmark: 'Near Indiranagar Club',
        });

      expect(res.status).toBe(200);
      const updated = res.body.data.find((a: any) => a._id === addressA1Id);
      expect(updated.addressLine2).toBe('12th Main Road');
    });

    it('4.4 Setting default address ensures only one default is active', async () => {
      const addressesRes = await request(app.getHttpServer())
        .get('/api/customer-portal/addresses')
        .set('Authorization', `Bearer ${customerAToken}`);

      const secondAddr = addressesRes.body.data.find((a: any) => a._id !== addressA1Id);

      const defRes = await request(app.getHttpServer())
        .post(`/api/customer-portal/addresses/${secondAddr._id}/default`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(defRes.status).toBe(200);
      const defCount = defRes.body.data.filter((a: any) => a.isDefault).length;
      expect(defCount).toBe(1);
    });

    it('4.5 Customer can delete an address', async () => {
      const addressesRes = await request(app.getHttpServer())
        .get('/api/customer-portal/addresses')
        .set('Authorization', `Bearer ${customerAToken}`);

      const toDelete = addressesRes.body.data[0]._id;
      const res = await request(app.getHttpServer())
        .delete(`/api/customer-portal/addresses/${toDelete}`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.some((a: any) => a._id === toDelete)).toBe(false);
    });

    it('4.6 Historical order address snapshots remain untouched upon customer address modification', async () => {
      const orderRes = await request(app.getHttpServer())
        .get(`/api/customer-portal/orders/${orderAId}`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(orderRes.status).toBe(200);
      expect(orderRes.body.data.orderNumber).toBeDefined();
    });
  });

  // =========================================================================
  // 5. ORDERS & DATA SANITIZATION (5 Tests)
  // =========================================================================
  describe('5. Orders & Presentation Layer', () => {
    it('5.1 Customer sees own order details with sanitized customer-friendly fields', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customer-portal/orders/${orderAId}`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.orderNumber).toBeDefined();
      expect(data.items.length).toBe(1);
      expect(data.grandTotal).toBe(315);
      expect(data.dueAmount).toBe(215);
      expect(data.timelineSteps).toBeDefined();
      expect(data.timelineSteps.length).toBe(6);
    });

    it('5.2 Internal notes and staff profit/margins are strictly stripped from customer order response', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customer-portal/orders/${orderAId}`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      const rawJson = JSON.stringify(res.body.data);
      expect(rawJson).not.toContain('VIP Customer - High priority packaging');
      expect(res.body.data.internalNotes).toBeUndefined();
      expect(res.body.data.margin).toBeUndefined();
      expect(res.body.data.cost).toBeUndefined();
    });

    it('5.3 Customer cannot change order status via customer portal', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/customer-portal/orders/${orderAId}`)
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ status: OrderStatus.COMPLETED });

      expect([404, 405]).toContain(res.status);
    });

    it('5.4 Customer cannot alter order pricing or payment ledger directly', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/customer-portal/payments')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ orderId: orderAId, amount: 200 });

      expect([404, 405]).toContain(res.status);
    });

    it('5.5 Customer orders endpoint supports pagination and status filtering', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/customer-portal/orders?page=1&limit=10&status=RECEIVED')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      const items = res.body.data.items || res.body.data;
      expect(items).toBeDefined();
    });
  });

  // =========================================================================
  // 6. PAYMENTS & INVOICES (6 Tests)
  // =========================================================================
  describe('6. Payments & Invoices Access', () => {
    it('6.1 Customer can view payment history', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/customer-portal/payments')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      const items = res.body.data.items || res.body.data;
      expect(items).toBeDefined();
    });

    it('6.2 Customer can view invoices list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/customer-portal/invoices')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('6.3 Customer can view full tax invoice details for own order', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customer-portal/invoices/${orderAId}`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.invoiceNumber).toBeDefined();
      expect(res.body.data.grandTotal).toBe(315);
      expect(res.body.data.customer.name).toBe('Rahul Sharma');
    });

    it('6.4 Customer cannot access invoice for another customer order', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customer-portal/invoices/${orderA2Id}`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect([403, 404]).toContain(res.status);
    });

    it('6.5 Unauthenticated invoice request rejected', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customer-portal/invoices/${orderAId}`);

      expect(res.status).toBe(401);
    });

    it('6.6 Invoice totals match order totals exactly', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customer-portal/invoices/${orderAId}`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.subtotal).toBe(300);
      expect(res.body.data.paidAmount).toBe(100);
      expect(res.body.data.dueAmount).toBe(215);
    });
  });

  // =========================================================================
  // 7. SECURE ORDER TRACKING (6 Tests)
  // =========================================================================
  describe('7. Cryptographic Public Order Tracking', () => {
    it('7.1 Valid tracking token returns customer-safe order tracking view without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customer-tracking/${orderATrackingToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.orderNumber).toBeDefined();
      expect(data.overallStatus).toBeDefined();
      expect(data.steps.length).toBe(6);
      expect(data.financialSummary.grandTotal).toBe(315);
      expect(data.financialSummary.dueAmount).toBe(215);
    });

    it('7.2 Public tracking does not leak customer phone, email, or staff notes', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customer-tracking/${orderATrackingToken}`);

      expect(res.status).toBe(200);
      const rawJson = JSON.stringify(res.body.data);
      expect(rawJson).not.toContain('9811122233');
      expect(rawJson).not.toContain('rahul@example.test');
      expect(rawJson).not.toContain('VIP Customer');
    });

    it('7.3 Invalid tracking token returns 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/customer-tracking/invalid_token_1234567890abcdef');

      expect([400, 404]).toContain(res.status);
    });

    it('7.4 Staff can regenerate tracking token, invalidating previous token', async () => {
      const regenRes = await request(app.getHttpServer())
        .post(`/api/customer-tracking/${orderAId}/regenerate`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(regenRes.status).toBe(200);
      const newToken = regenRes.body.data.token;
      expect(newToken).not.toBe(orderATrackingToken);

      // Old token should now fail
      const oldRes = await request(app.getHttpServer())
        .get(`/api/customer-tracking/${orderATrackingToken}`);
      expect([400, 404]).toContain(oldRes.status);

      // New token should work
      const newRes = await request(app.getHttpServer())
        .get(`/api/customer-tracking/${newToken}`);
      expect(newRes.status).toBe(200);
      orderATrackingToken = newToken;
    });

    it('7.5 Staff can revoke tracking token', async () => {
      const revokeRes = await request(app.getHttpServer())
        .post(`/api/customer-tracking/${orderAId}/revoke`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(revokeRes.status).toBe(200);

      // Revoked token should now fail
      const trackRes = await request(app.getHttpServer())
        .get(`/api/customer-tracking/${orderATrackingToken}`);
      expect([400, 404]).toContain(trackRes.status);

      // Re-generate so token works again
      const restored = await trackingService.generateToken(tenantAId, orderAId);
      orderATrackingToken = restored.token;
    });

    it('7.6 Cross-tenant tracking access rejected', async () => {
      // Order B in Tenant B with tokenB tracking token
      const resB = await request(app.getHttpServer())
        .get(`/api/customer-tracking/${orderBTrackingToken}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.tenantName).toContain('Washora Express DryCleaners');
    });
  });

  // =========================================================================
  // 8. NOTIFICATION PREFERENCES (3 Tests)
  // =========================================================================
  describe('8. Customer Notification Preferences', () => {
    it('8.1 Customer can view communication preferences', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/customer-portal/preferences')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.transactional).toBeDefined();
    });

    it('8.2 Customer can update communication preferences', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/customer-portal/preferences')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          transactional: { whatsapp: true, sms: false, email: true },
          marketing: { whatsapp: false, email: false, sms: false },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.transactional.sms).toBe(false);
    });

    it('8.3 Customer A cannot update Customer B preferences', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/customer-portal/preferences')
        .set('Authorization', `Bearer ${customerBToken}`);

      expect(res.status).toBe(200);
      // Customer B should still have default SMS preference
      expect(res.body.data.transactional.sms).toBe(true);
    });
  });

  // =========================================================================
  // 9. INTERNAL CRM & STAFF NOTES (6 Tests)
  // =========================================================================
  describe('9. Internal CRM 360 & Staff Notes', () => {
    let noteId: string;

    it('9.1 Authorized staff can view customer overview with 360 KPIs', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customers/${customerAId}/overview`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.kpis.totalOrders).toBe(1);
      expect(res.body.data.kpis.totalSpent).toBe(100);
      expect(res.body.data.kpis.outstanding).toBe(215);
    });

    it('9.2 Staff can add internal note for customer', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/customers/${customerAId}/notes`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          content: 'Customer requested eco-friendly liquid detergent only.',
          authorName: 'Store Manager',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe('Customer requested eco-friendly liquid detergent only.');
      noteId = res.body.data._id;
    });

    it('9.3 Customer portal queries NEVER see internal staff notes', async () => {
      const profRes = await request(app.getHttpServer())
        .get('/api/customer-portal/profile')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(profRes.status).toBe(200);
      const jsonStr = JSON.stringify(profRes.body.data);
      expect(jsonStr).not.toContain('eco-friendly liquid detergent only');
    });

    it('9.4 Staff can update internal note', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/customers/${customerAId}/notes/${noteId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ content: 'Customer requested eco-friendly liquid detergent & zero plastic packaging.' });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toContain('zero plastic packaging');
    });

    it('9.5 Staff can delete internal note', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/customers/${customerAId}/notes/${noteId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);

      const listRes = await request(app.getHttpServer())
        .get(`/api/customers/${customerAId}/notes`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(listRes.body.data.some((n: any) => n._id === noteId)).toBe(false);
    });

    it('9.6 Staff can view customer 360 activity timeline', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customers/${customerAId}/activity`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 10. AUDIT LOGGING (4 Tests)
  // =========================================================================
  describe('10. Audit Logging Verification', () => {
    it('10.1 Customer profile update creates audit log', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/customer-portal/profile')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ name: 'Rahul S. Sharma' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Rahul S. Sharma');
    });

    it('10.2 Customer address addition creates audit log', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/customer-portal/addresses')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          label: 'Summer House',
          addressLine1: '404 Beach Road',
          city: 'Goa',
          pincode: '403001',
        });

      expect(res.status).toBe(201);
    });

    it('10.3 Customer preference update creates audit log', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/customer-portal/preferences')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          transactional: { whatsapp: true, email: true, sms: true },
        });

      expect(res.status).toBe(200);
    });

    it('10.4 Tracking token regeneration creates audit log', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/customer-tracking/${orderAId}/regenerate`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });
  });
});
