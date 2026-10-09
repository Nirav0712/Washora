import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import {
  BusinessType,
  RoleType,
  UnitType,
  PricingTier,
  OrderStatus,
  PaymentMethod,
  DiscountType,
} from '@washora/shared';

describe('Phase 03 — Production POS, Customers, Orders, Garments, Payments & Pricing Security Suite', () => {
  let mongod: MongoMemoryServer;
  let app: INestApplication;

  // Tenant A data
  let tokenA: string;
  let tenantAId: string;
  let branchAId: string;
  let customerAId: string;
  let categoryAId: string;
  let productA500Id: string;
  let orderAId: string;
  let paymentAId: string;
  let garmentAId: string;

  // Tenant B data
  let tokenB: string;
  let tenantBId: string;
  let branchBId: string;
  let customerBId: string;
  let productBId: string;
  let orderBId: string;
  let paymentBId: string;
  let garmentBId: string;

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

    // 1. Register Tenant A
    const resA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: `Owner Alpha ${timestamp}`,
        email: `alpha_pos_${timestamp}@washora.test`,
        password: 'Password@123',
        phone: '+919811100001',
        tenantName: `Alpha POS Laundry ${timestamp}`,
        businessType: BusinessType.LAUNDRY,
        branchName: 'Alpha Flagship Hub',
        branchCity: 'Bengaluru',
      });

    tokenA = resA.body.data.accessToken;
    tenantAId = resA.body.data.tenant.id;
    branchAId = resA.body.data.membership.branchIds[0];

    // 2. Register Tenant B
    const resB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: `Owner Beta ${timestamp}`,
        email: `beta_pos_${timestamp}@washora.test`,
        password: 'Password@123',
        phone: '+919811100002',
        tenantName: `Beta POS Cleaners ${timestamp}`,
        businessType: BusinessType.DRY_CLEANING,
        branchName: 'Beta Main Plant',
        branchCity: 'Mumbai',
      });

    tokenB = resB.body.data.accessToken;
    tenantBId = resB.body.data.tenant.id;
    branchBId = resB.body.data.membership.branchIds[0];

    // 3. Create Customer in Tenant A
    const custARes = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Rahul Sharma',
        phone: '+91 98765 43210',
        email: 'rahul@example.com',
        addresses: [{ addressLine1: 'Indiranagar 100ft Rd', city: 'Bengaluru', isDefault: true }],
      });
    customerAId = custARes.body.data.id || custARes.body.data._id;

    // 4. Create Customer in Tenant B
    const custBRes = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Vikram Patel',
        phone: '+91 98765 99999',
        email: 'vikram@example.com',
        addresses: [{ addressLine1: 'Bandra West', city: 'Mumbai', isDefault: true }],
      });
    customerBId = custBRes.body.data.id || custBRes.body.data._id;

    // 5. Create Category in Tenant A
    const catARes = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: `Apparel Care ${timestamp}`,
        description: 'Everyday garments and delicates',
      });
    categoryAId = catARes.body.data.id || catARes.body.data._id;

    // 6. Create Premium Saree Product in Tenant A with base price ₹500
    const prodA500Res = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Pure Kanjeevaram Saree',
        categoryId: categoryAId,
        sku: `SKU-SAR-500-${timestamp}`,
        unit: UnitType.PIECE,
        prices: {
          regular: 500,
          express: 750,
          sameDay: 1000,
        },
      });
    productA500Id = prodA500Res.body.data.id || prodA500Res.body.data._id;

    // 7. Create Product in Tenant B
    const catBRes = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: `Beta Garments ${timestamp}`,
      });
    const categoryBId = catBRes.body.data.id || catBRes.body.data._id;

    const prodBRes = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Beta Designer Blazer',
        categoryId: categoryBId,
        sku: `SKU-BETA-${timestamp}`,
        unit: UnitType.PIECE,
        prices: {
          regular: 600,
          express: 900,
          sameDay: 1200,
        },
      });
    productBId = prodBRes.body.data.id || prodBRes.body.data._id;

    // 8. Create Order in Tenant A
    const orderARes = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        customerId: customerAId,
        branchId: branchAId,
        pricingTier: PricingTier.REGULAR,
        items: [{ productId: productA500Id, quantity: 2 }],
        payment: { amount: 500, method: PaymentMethod.UPI },
      });
    if (!orderARes.body.data) {
      console.log('orderARes status:', orderARes.status, 'body:', JSON.stringify(orderARes.body));
    }
    orderAId = orderARes.body.data?.id || orderARes.body.data?._id;
    if (orderARes.body.data?.garmentIds?.[0]) {
      garmentAId = orderARes.body.data.garmentIds[0]._id || orderARes.body.data.garmentIds[0];
    }
    if (orderARes.body.data?.payments?.[0]) {
      paymentAId = orderARes.body.data.payments[0]._id || orderARes.body.data.payments[0].id;
    }

    // 9. Create Order in Tenant B
    const orderBRes = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        customerId: customerBId,
        branchId: branchBId,
        pricingTier: PricingTier.REGULAR,
        items: [{ productId: productBId, quantity: 1 }],
        payment: { amount: 630, method: PaymentMethod.CASH },
      });
    if (!orderBRes.body.data) {
      console.log('orderBRes status:', orderBRes.status, 'body:', JSON.stringify(orderBRes.body));
    }
    orderBId = orderBRes.body.data?.id || orderBRes.body.data?._id;
    if (orderBRes.body.data?.garmentIds?.[0]) {
      garmentBId = orderBRes.body.data.garmentIds[0]._id || orderBRes.body.data.garmentIds[0];
    }
    if (orderBRes.body.data?.payments?.[0]) {
      paymentBId = orderBRes.body.data.payments[0]._id || orderBRes.body.data.payments[0].id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Customer Multi-Tenant & RBAC Security', () => {
    it('1. Tenant A cannot access Tenant B customer (returns 404 / empty search)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customers/${customerBId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect([404, 403]).toContain(res.status);
    });

    it('2. Tenant A cannot update Tenant B customer', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/customers/${customerBId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Hacked Vikram' });

      expect([404, 403]).toContain(res.status);
    });

    it('3. Tenant A cannot delete Tenant B customer', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/customers/${customerBId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect([404, 403]).toContain(res.status);
    });

    it('23. Tenant A cannot access Tenant B customer balance', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customers/${customerBId}/balance`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect([404, 403]).toContain(res.status);
    });
  });

  describe('2. Order Security & Tenant Isolation', () => {
    it('4. Tenant A cannot access Tenant B order', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/orders/${orderBId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect([404, 403]).toContain(res.status);
    });

    it('5. Tenant A cannot create an order using Tenant B customer', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          customerId: customerBId,
          branchId: branchAId,
          items: [{ productId: productA500Id, quantity: 1 }],
        });

      expect([404, 400, 403]).toContain(res.status);
    });

    it('6. Tenant A cannot create an order using Tenant B product', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          customerId: customerAId,
          branchId: branchAId,
          items: [{ productId: productBId, quantity: 1 }],
        });

      expect([404, 400, 403]).toContain(res.status);
    });

    it('7. Explicit Security Test: Tenant injection & ₹1 price spoofing attack rejected', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          tenantId: tenantBId,
          customerId: customerBId,
          branchId: branchBId,
          items: [
            {
              productId: productBId,
              quantity: 1,
              unitPrice: 1,
              price: 1,
            },
          ],
        });

      expect([404, 400, 403]).toContain(res.status);
    });
  });

  describe('3. Server-Authoritative Pricing & Financial Integrity', () => {
    it('8. Frontend-supplied unitPrice = ₹1 is IGNORED, backend enforces ₹500', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          customerId: customerAId,
          branchId: branchAId,
          pricingTier: PricingTier.REGULAR,
          items: [
            {
              productId: productA500Id,
              quantity: 1,
              unitPrice: 1, // Malicious spoof
              lineTotal: 1,
            },
          ],
          grandTotal: 1,
        });

      expect(res.status).toBe(201);
      const order = res.body.data;
      expect(order.items[0].unitPrice).toBe(500);
      expect(order.subtotal).toBe(500);
      expect(order.grandTotal).toBeGreaterThanOrEqual(500);
    });

    it('9. Pricing Tier multiplier resolution: EXPRESS tier uses ₹750 rate', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          customerId: customerAId,
          branchId: branchAId,
          pricingTier: PricingTier.EXPRESS,
          items: [{ productId: productA500Id, quantity: 1 }],
        });

      expect(res.status).toBe(201);
      const order = res.body.data;
      expect(order.items[0].unitPrice).toBe(750);
      expect(order.subtotal).toBe(750);
    });

    it('13. Frontend cannot manipulate grandTotal or bypass tax calculation', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          customerId: customerAId,
          branchId: branchAId,
          items: [{ productId: productA500Id, quantity: 2 }],
          grandTotal: 10,
          taxAmount: 0,
        });

      expect(res.status).toBe(201);
      const order = res.body.data;
      expect(order.subtotal).toBe(1000);
      expect(order.grandTotal).toBe(1050); // 1000 + 5% default tax = 1050
    });

    it('15. Payment cannot exceed allowed order balance', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          orderId: orderAId,
          amount: 999999, // Exceeds due balance
          method: PaymentMethod.UPI,
        });

      expect([400, 422]).toContain(res.status);
    });

    it('16. Refund cannot exceed refundable amount on payment', async () => {
      if (paymentAId) {
        const res = await request(app.getHttpServer())
          .post(`/api/payments/${paymentAId}/refund`)
          .set('Authorization', `Bearer ${tokenA}`)
          .send({
            amount: 999999,
            reason: 'Excessive refund attempt',
          });

        expect([400, 422]).toContain(res.status);
      }
    });

    it('17. Discount cannot create a negative grand total', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          customerId: customerAId,
          branchId: branchAId,
          items: [{ productId: productA500Id, quantity: 1 }],
          discount: {
            type: DiscountType.AMOUNT,
            value: 9999, // Exceeds subtotal
          },
        });

      expect(res.status).toBe(201);
      const order = res.body.data;
      expect(order.grandTotal).toBeGreaterThanOrEqual(0);
      expect(order.discountAmount).toBeLessThanOrEqual(500);
    });
  });

  describe('4. Order Lifecycle & Status Transitions', () => {
    it('18. Valid status transition: RECEIVED → PROCESSING succeeds', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/orders/${orderAId}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          status: OrderStatus.PROCESSING,
          note: 'Washing cycle started',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe(OrderStatus.PROCESSING);
    });

    it('19. Invalid status transition: PROCESSING → DELIVERED directly is rejected', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/orders/${orderAId}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          status: OrderStatus.DELIVERED,
        });

      expect([400, 422]).toContain(res.status);
    });

    it('20. Cancelled order cannot be resumed into active workflow', async () => {
      // First cancel the order
      const cancelRes = await request(app.getHttpServer())
        .post(`/api/orders/${orderAId}/cancel`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ reason: 'Customer changed mind' });

      expect(cancelRes.status).toBe(201);
      expect(cancelRes.body.data.status).toBe(OrderStatus.CANCELLED);

      // Now attempt invalid transition from CANCELLED to PROCESSING
      const resumeRes = await request(app.getHttpServer())
        .post(`/api/orders/${orderAId}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: OrderStatus.PROCESSING });

      expect([400, 422]).toContain(resumeRes.status);
    });
  });

  describe('5. Garments, Payments & Multi-Tenant Isolation', () => {
    it('21. Tenant A cannot access Tenant B payments', async () => {
      if (paymentBId) {
        const res = await request(app.getHttpServer())
          .get(`/api/payments/${paymentBId}`)
          .set('Authorization', `Bearer ${tokenA}`);

        expect([404, 403]).toContain(res.status);
      }
    });

    it('22. Tenant A cannot access Tenant B garments', async () => {
      if (garmentBId) {
        const res = await request(app.getHttpServer())
          .get(`/api/garments/${garmentBId}`)
          .set('Authorization', `Bearer ${tokenA}`);

        expect([404, 403]).toContain(res.status);
      }
    });

    it('24. Unauthenticated customer/order/payment requests return 401', async () => {
      const res1 = await request(app.getHttpServer()).get('/api/customers');
      const res2 = await request(app.getHttpServer()).get('/api/orders');
      const res3 = await request(app.getHttpServer()).get('/api/payments');

      expect(res1.status).toBe(401);
      expect(res2.status).toBe(401);
      expect(res3.status).toBe(401);
    });

    it('26. Concurrently created orders get sequential unique order numbers without collision', async () => {
      const [o1, o2, o3] = await Promise.all([
        request(app.getHttpServer())
          .post('/api/orders')
          .set('Authorization', `Bearer ${tokenA}`)
          .send({
            customerId: customerAId,
            branchId: branchAId,
            items: [{ productId: productA500Id, quantity: 1 }],
          }),
        request(app.getHttpServer())
          .post('/api/orders')
          .set('Authorization', `Bearer ${tokenA}`)
          .send({
            customerId: customerAId,
            branchId: branchAId,
            items: [{ productId: productA500Id, quantity: 1 }],
          }),
        request(app.getHttpServer())
          .post('/api/orders')
          .set('Authorization', `Bearer ${tokenA}`)
          .send({
            customerId: customerAId,
            branchId: branchAId,
            items: [{ productId: productA500Id, quantity: 1 }],
          }),
      ]);

      const numbers = [o1.body.data.orderNumber, o2.body.data.orderNumber, o3.body.data.orderNumber];
      const uniqueNumbers = new Set(numbers);
      expect(uniqueNumbers.size).toBe(3);
    });

    it('28. Invalid ObjectId returns safe 400 / 404 without crashing or stack trace', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/orders/not-a-valid-object-id')
        .set('Authorization', `Bearer ${tokenA}`);

      expect([400, 404]).toContain(res.status);
    });

    it('30. Order totals remain internally consistent (subtotal, tax, grandTotal, paid, due)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/orders/${orderBId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      const o = res.body.data;
      expect(o.grandTotal).toBe(Math.round((o.subtotal + (o.taxAmount || 0) - (o.discountAmount || 0)) * 100) / 100);
      expect(o.dueAmount).toBe(Math.max(0, Math.round((o.grandTotal - o.paidAmount) * 100) / 100));
    });
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongod) await mongod.stop();
  });
});
