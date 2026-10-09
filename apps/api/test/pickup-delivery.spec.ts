import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AuditService } from '../src/modules/audit/audit.service';
import {
  RoleType,
  PickupStatus,
  DeliveryStatus,
  LogisticsPriority,
  PickupFailureReason,
  DeliveryFailureReason,
  PaymentMethod,
  OrderStatus,
  AddressType,
  EmploymentType,
  PricingTier,
  UnitType,
} from '@washora/shared';

describe('Phase 07 — Pickup & Delivery Management + Route Operations Suite', () => {
  let mongod: MongoMemoryServer;
  let app: INestApplication;

  // Tenant A Credentials & IDs
  let tokenA: string;
  let tenantAId: string;
  let branchA1Id: string;
  let branchA2Id: string;
  let customerAId: string;
  let orderAId: string;
  let agentAId: string;
  let agentAToken: string;
  let cashierTokenA: string;

  // Tenant B Credentials & IDs
  let tokenB: string;
  let tenantBId: string;
  let branchBId: string;
  let customerBId: string;
  let orderBId: string;
  let agentBId: string;

  // Phase 07 Entities in Tenant A
  let pickupA1Id: string;
  let pickupA2Id: string;
  let deliveryA1Id: string;
  let deliveryA2Id: string;

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

    // 1. Setup Tenant A
    const regResA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Rohan Sharma',
        email: 'rohan@washoradeluxe.test',
        password: 'Password@123',
        phone: '+919876543210',
        tenantName: 'Washora Deluxe Laundry',
        businessType: 'LAUNDRY',
        branchName: 'Main Hub Bandra',
      })
      .expect(201);

    tokenA = regResA.body.data.accessToken;
    tenantAId = regResA.body.data.tenant.id;
    branchA1Id = regResA.body.data.branches[0].id || regResA.body.data.branches[0]._id;

    // Create second branch for Tenant A
    const branchResA2 = await request(app.getHttpServer())
      .post('/api/branches')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Andheri Express Plant',
        code: 'AND-01',
        phone: '+919876543299',
        address: 'Andheri East Hub, Mumbai 400069',
      })
      .expect(201);
    branchA2Id = branchResA2.body.data._id || branchResA2.body.data.id;

    // 2. Setup Tenant B
    const regResB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Aakash Patel',
        email: 'aakash@cleanexpress.test',
        password: 'Password@123',
        phone: '+919876543222',
        tenantName: 'CleanExpress Washers',
        businessType: 'DRY_CLEANING',
        branchName: 'CleanExpress Juhu',
      })
      .expect(201);

    tokenB = regResB.body.data.accessToken;
    tenantBId = regResB.body.data.tenant.id;
    branchBId = regResB.body.data.branches[0].id || regResB.body.data.branches[0]._id;

    // 3. Create Delivery Agent Staff in Tenant A
    const staffResA = await request(app.getHttpServer())
      .post('/api/staff')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Suresh Kumar Rider',
        email: 'suresh.rider@washoradeluxe.test',
        password: 'Password@123',
        phone: '+919111222333',
        roleCode: RoleType.DELIVERY_AGENT,
        employmentType: EmploymentType.FULL_TIME,
        primaryBranchId: branchA1Id,
        designation: 'Lead Delivery Executive',
        department: 'Logistics',
      })
      .expect(201);
    agentAId = staffResA.body.data._id || staffResA.body.data.id;

    const loginResA = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'suresh.rider@washoradeluxe.test',
        password: 'Password@123',
      })
      .expect(200);
    agentAToken = loginResA.body.data.accessToken;

    // 4. Create Delivery Agent Staff in Tenant B
    const staffResB = await request(app.getHttpServer())
      .post('/api/staff')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Ramesh Singh Rider B',
        email: 'ramesh.rider@cleanexpress.test',
        password: 'Password@123',
        phone: '+919222333444',
        roleCode: RoleType.DELIVERY_AGENT,
        employmentType: EmploymentType.FULL_TIME,
        primaryBranchId: branchBId,
        designation: 'Logistics Rider',
        department: 'Logistics',
      })
      .expect(201);
    agentBId = staffResB.body.data._id || staffResB.body.data.id;

    // 5. Create Cashier in Tenant A
    const staffCashierResA = await request(app.getHttpServer())
      .post('/api/staff')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Anjali Cashier',
        email: 'anjali.cashier@washoradeluxe.test',
        password: 'Password@123',
        phone: '+919333444555',
        roleCode: RoleType.CASHIER,
        employmentType: EmploymentType.FULL_TIME,
        primaryBranchId: branchA1Id,
        designation: 'Counter Cashier',
        department: 'Operations',
      })
      .expect(201);

    const loginCashierResA = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'anjali.cashier@washoradeluxe.test',
        password: 'Password@123',
      })
      .expect(200);
    cashierTokenA = loginCashierResA.body.data.accessToken;

    // 6. Create Customer in Tenant A
    // 6. Create Customer in Tenant A
    const custResA = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Pooja Hegde',
        phone: '+919988776611',
        email: 'pooja.hegde@client.test',
        addresses: [{ addressLine1: 'Flat 402, Sea Breeze Tower, Bandra West', city: 'Mumbai', isDefault: true }],
      })
      .expect(201);
    customerAId = custResA.body.data._id || custResA.body.data.id;

    // 7. Create Customer in Tenant B
    const custResB = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Karan Johar',
        phone: '+919988776622',
        email: 'karan.johar@client.test',
        addresses: [{ addressLine1: 'Bungalow 7, Juhu Tara Road', city: 'Mumbai', isDefault: true }],
      })
      .expect(201);
    customerBId = custResB.body.data._id || custResB.body.data.id;

    // 8. Create Category & Product in Tenant A
    const catResA = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Traditional Apparel',
        description: 'Ethnic and delicate wear',
      })
      .expect(201);
    const catAId = catResA.body.data._id || catResA.body.data.id;

    const prodResA = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Silk Designer Saree',
        categoryId: catAId,
        sku: 'SKU-SAR-001',
        unit: UnitType.PIECE,
        prices: {
          regular: 500,
          express: 750,
          sameDay: 1000,
        },
      })
      .expect(201);
    const prodAId = prodResA.body.data._id || prodResA.body.data.id;

    // 9. Create Ready Order in Tenant A
    const orderResA = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        branchId: branchA1Id,
        customerId: customerAId,
        pricingTier: PricingTier.REGULAR,
        items: [{ productId: prodAId, quantity: 2 }],
        notes: 'Handle embroidery with special care',
      })
      .expect(201);
    orderAId = orderResA.body.data._id || orderResA.body.data.id;

    // 10. Create Category, Product & Order in Tenant B
    const catResB = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Suits & Coats',
      })
      .expect(201);
    const catBId = catResB.body.data._id || catResB.body.data.id;

    const prodResB = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Italian Wool Suit',
        categoryId: catBId,
        sku: 'SKU-SUIT-001',
        unit: UnitType.PIECE,
        prices: {
          regular: 800,
          express: 1200,
          sameDay: 1500,
        },
      })
      .expect(201);
    const prodBId = prodResB.body.data._id || prodResB.body.data.id;

    const orderResB = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        branchId: branchBId,
        customerId: customerBId,
        pricingTier: PricingTier.REGULAR,
        items: [{ productId: prodBId, quantity: 1 }],
      })
      .expect(201);
    orderBId = orderResB.body.data._id || orderResB.body.data.id;
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  // ==========================================
  // 1. CUSTOMER MULTI-ADDRESS MANAGEMENT
  // ==========================================
  describe('1. Customer Multi-Address Management', () => {
    let homeAddrId: string;

    it('1.1 should add multiple addresses (HOME, OFFICE) to a customer', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/customers/${customerAId}/addresses`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          label: 'Home Apartment',
          type: AddressType.HOME,
          name: 'Pooja Hegde',
          phone: '+919988776611',
          addressLine1: 'Flat 402, Sea Breeze Tower, Bandra West',
          addressLine2: 'Carter Road',
          area: 'Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          landmark: 'Opposite Joggers Park',
          isDefault: true,
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const homeAddr = res.body.data.find((a: any) => a.label === 'Home Apartment');
      expect(homeAddr).toBeDefined();
      expect(homeAddr.isDefault).toBe(true);
      expect(homeAddr.type).toBe(AddressType.HOME);
      homeAddrId = homeAddr._id;

      // Add second address (OFFICE)
      const resOffice = await request(app.getHttpServer())
        .post(`/api/customers/${customerAId}/addresses`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          label: 'Studio Office',
          type: AddressType.OFFICE,
          name: 'Pooja Hegde Studio',
          phone: '+919988776611',
          addressLine1: 'Unit 12B, Trade World B-Wing',
          area: 'BKC',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400051',
          landmark: 'Next to Asian Heart Institute',
          isDefault: false,
        })
        .expect(201);

      expect(Array.isArray(resOffice.body.data)).toBe(true);
      expect(resOffice.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('1.2 should get all addresses for a customer', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/customers/${customerAId}/addresses`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('1.3 should set address as default and toggle other addresses off', async () => {
      const addressesRes = await request(app.getHttpServer())
        .get(`/api/customers/${customerAId}/addresses`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const officeAddr = addressesRes.body.data.find((a: any) => a.type === AddressType.OFFICE);
      expect(officeAddr).toBeDefined();

      const res = await request(app.getHttpServer())
        .post(`/api/customers/${customerAId}/addresses/${officeAddr._id}/default`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const updatedOffice = res.body.data.find((a: any) => a._id === officeAddr._id);
      expect(updatedOffice.isDefault).toBe(true);
    });

    it('1.4 should delete an address from customer profile', async () => {
      const addressesRes = await request(app.getHttpServer())
        .get(`/api/customers/${customerAId}/addresses`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const countBefore = addressesRes.body.data.length;
      const addrToDelete = addressesRes.body.data[0];

      const res = await request(app.getHttpServer())
        .delete(`/api/customers/${customerAId}/addresses/${addrToDelete._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.length).toBe(countBefore - 1);
    });
  });

  // ==========================================
  // 2. PICKUP LIFECYCLE & WORKFLOW
  // ==========================================
  describe('2. Pickup Request Lifecycle & Operations', () => {
    it('2.1 should create a pickup request with auto-generated PU-XXXXXX and address snapshot', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/pickups')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          customerId: customerAId,
          pickupAddress: {
            name: 'Pooja Hegde',
            phone: '+919988776611',
            addressLine1: 'Flat 402, Sea Breeze Tower',
            area: 'Bandra West',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400050',
            landmark: 'Opposite Joggers Park',
          },
          scheduledDate: new Date().toISOString(),
          scheduledTimeFrom: '09:00',
          scheduledTimeTo: '12:00',
          priority: LogisticsPriority.HIGH,
          customerNotes: 'Ring bell twice, silk items inside red laundry bag',
          specialInstructions: 'Inspect silk borders at door',
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.pickupNumber).toMatch(/^PU-\d{6}$/);
      expect(res.body.data.status).toBe(PickupStatus.SCHEDULED);
      expect(res.body.data.priority).toBe(LogisticsPriority.HIGH);
      expect(res.body.data.pickupAddress.area).toBe('Bandra West');
      pickupA1Id = res.body.data._id || res.body.data.id;
    });

    it('2.2 should assign delivery agent to pickup', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/pickups/${pickupA1Id}/assign`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          assignedAgentId: agentAId,
          notes: 'Assigned to senior logistics rider Suresh',
        })
        .expect(200);

      expect(res.body.data.status).toBe(PickupStatus.ASSIGNED);
      const assignedId = res.body.data.assignedAgentId?._id || res.body.data.assignedAgentId?.id || res.body.data.assignedAgentId;
      expect(assignedId.toString()).toBe(agentAId.toString());
    });

    it('2.3 should start pickup trip (OUT_FOR_PICKUP)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/pickups/${pickupA1Id}/start`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.status).toBe(PickupStatus.OUT_FOR_PICKUP);
    });

    it('2.4 should mark arrived at customer location (ARRIVED)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/pickups/${pickupA1Id}/arrive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.status).toBe(PickupStatus.ARRIVED);
    });

    it('2.5 should complete pickup and mark PICKED_UP', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/pickups/${pickupA1Id}/complete`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.status).toBe(PickupStatus.PICKED_UP);
      expect(res.body.data.pickedUpAt).toBeDefined();
    });

    it('2.6 should reject invalid state transition (PICKED_UP -> OUT_FOR_PICKUP)', async () => {
      await request(app.getHttpServer())
        .post(`/api/pickups/${pickupA1Id}/start`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);
    });

    it('2.7 should handle pickup failure attempt and increment attempt count', async () => {
      // Create second pickup for failure test
      const puRes2 = await request(app.getHttpServer())
        .post('/api/pickups')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          customerId: customerAId,
          pickupAddress: {
            name: 'Pooja Hegde',
            phone: '+919988776611',
            addressLine1: 'BKC Studio Office',
            area: 'BKC',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400051',
          },
          scheduledDate: new Date().toISOString(),
          scheduledTimeFrom: '14:00',
          scheduledTimeTo: '17:00',
        })
        .expect(201);
      pickupA2Id = puRes2.body.data._id || puRes2.body.data.id;

      // Assign & Start
      await request(app.getHttpServer())
        .post(`/api/pickups/${pickupA2Id}/assign`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ assignedAgentId: agentAId })
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/pickups/${pickupA2Id}/start`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      // Fail attempt
      const failRes = await request(app.getHttpServer())
        .post(`/api/pickups/${pickupA2Id}/fail`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          reason: PickupFailureReason.CUSTOMER_NOT_AVAILABLE,
          note: 'Door was locked, security guard confirmed customer was out of town',
        })
        .expect(200);

      expect(failRes.body.data.status).toBe(PickupStatus.FAILED);
      expect(failRes.body.data.attemptCount).toBe(1);
      expect(failRes.body.data.attempts.length).toBe(1);
      expect(failRes.body.data.attempts[0].reason).toBe(PickupFailureReason.CUSTOMER_NOT_AVAILABLE);
    });

    it('2.8 should reschedule failed pickup with history tracking', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await request(app.getHttpServer())
        .post(`/api/pickups/${pickupA2Id}/reschedule`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          scheduledDate: tomorrow.toISOString(),
          scheduledTimeFrom: '10:00',
          scheduledTimeTo: '13:00',
          reason: 'Customer requested morning slot tomorrow',
        })
        .expect(200);

      expect(res.body.data.status).toBe(PickupStatus.SCHEDULED);
      expect(res.body.data.rescheduleHistory.length).toBe(1);
      expect(res.body.data.rescheduleHistory[0].reason).toBe('Customer requested morning slot tomorrow');
      expect(res.body.data.scheduledTimeFrom).toBe('10:00');
    });

    it('2.9 should cancel pickup with audit note', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/pickups/${pickupA2Id}/cancel`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          reason: 'Customer decided to drop clothes at branch directly',
        })
        .expect(200);

      expect(res.body.data.status).toBe(PickupStatus.CANCELLED);
      expect(res.body.data.internalNotes).toContain('Customer decided to drop clothes');
    });

    it('2.10 should reject cancelling already completed pickup', async () => {
      await request(app.getHttpServer())
        .post(`/api/pickups/${pickupA1Id}/cancel`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ reason: 'Try cancel completed' })
        .expect(400);
    });

    it('2.11 should reject rescheduling completed pickup', async () => {
      await request(app.getHttpServer())
        .post(`/api/pickups/${pickupA1Id}/reschedule`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ newDate: new Date().toISOString() })
        .expect(400);
    });
  });

  // ==========================================
  // 3. DELIVERY LIFECYCLE & WORKFLOW
  // ==========================================
  describe('3. Delivery Request Lifecycle & Operations', () => {
    it('3.1 should create a delivery request with auto-generated DEL-XXXXXX and order linkage', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          orderId: orderAId,
          customerId: customerAId,
          deliveryAddress: {
            name: 'Pooja Hegde',
            phone: '+919988776611',
            addressLine1: 'Flat 402, Sea Breeze Tower',
            area: 'Bandra West',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400050',
            landmark: 'Opposite Joggers Park',
          },
          scheduledDate: new Date().toISOString(),
          scheduledTimeFrom: '14:00',
          scheduledTimeTo: '18:00',
          priority: LogisticsPriority.NORMAL,
          customerNotes: 'Hang garments on arrival, do not fold',
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.deliveryNumber).toMatch(/^DEL-\d{6}$/);
      expect(res.body.data.status).toBe(DeliveryStatus.SCHEDULED);
      const ordId = res.body.data.orderId?._id || res.body.data.orderId?.id || res.body.data.orderId;
      expect(ordId.toString()).toBe(orderAId.toString());
      expect(res.body.data.deliveryAddress.city).toBe('Mumbai');
      deliveryA1Id = res.body.data._id || res.body.data.id;
    });

    it('3.2 should assign delivery agent to delivery', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryA1Id}/assign`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          assignedAgentId: agentAId,
          notes: 'Assigned to Suresh for afternoon route',
        })
        .expect(200);

      expect(res.body.data.status).toBe(DeliveryStatus.ASSIGNED);
      const assignedId = res.body.data.assignedAgentId?._id || res.body.data.assignedAgentId?.id || res.body.data.assignedAgentId;
      expect(assignedId.toString()).toBe(agentAId.toString());
    });

    it('3.3 should start delivery trip (OUT_FOR_DELIVERY)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryA1Id}/start`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.status).toBe(DeliveryStatus.OUT_FOR_DELIVERY);
      expect(res.body.data.outForDeliveryAt).toBeDefined();
    });

    it('3.4 should mark arrived at customer destination (ARRIVED)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryA1Id}/arrive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.status).toBe(DeliveryStatus.ARRIVED);
    });

    it('3.5 should save proof of delivery (POD)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryA1Id}/proof`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          recipientName: 'Pooja Hegde',
          recipientPhone: '+919988776611',
          deliveryNote: 'Clean silk sarees handed over in hanger covers',
          signatureUrl: 'https://cloudinary.com/washora/signatures/pod-001.png',
          photoUrl: 'https://cloudinary.com/washora/photos/pod-001.jpg',
        })
        .expect(200);

      expect(res.body.data.proofOfDelivery).toBeDefined();
      expect(res.body.data.proofOfDelivery.recipientName).toBe('Pooja Hegde');
      expect(res.body.data.proofOfDelivery.signatureUrl).toContain('signatures');
    });

    it('3.6 should complete delivery and update order status to DELIVERED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryA1Id}/complete`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.status).toBe(DeliveryStatus.DELIVERED);
      expect(res.body.data.deliveredAt).toBeDefined();

      // Verify order status is synchronized
      const ordRes = await request(app.getHttpServer())
        .get(`/api/orders/${orderAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(ordRes.body.data.status).toBe(OrderStatus.DELIVERED);
    });

    it('3.7 should reject invalid state transition on completed delivery', async () => {
      await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryA1Id}/start`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);
    });

    it('3.8 should handle delivery failure attempt and rescheduling', async () => {
      // Create second delivery for failure test
      const delRes2 = await request(app.getHttpServer())
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          orderId: orderAId,
          customerId: customerAId,
          deliveryAddress: {
            name: 'Pooja Hegde',
            phone: '+919988776611',
            addressLine1: 'BKC Studio Office',
            area: 'BKC',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400051',
          },
          scheduledDate: new Date().toISOString(),
          scheduledTimeFrom: '16:00',
          scheduledTimeTo: '19:00',
        })
        .expect(201);
      deliveryA2Id = delRes2.body.data._id || delRes2.body.data.id;

      // Assign & Start
      await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryA2Id}/assign`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ assignedAgentId: agentAId })
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryA2Id}/start`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      // Fail delivery
      const failRes = await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryA2Id}/fail`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          reason: DeliveryFailureReason.PHONE_UNREACHABLE,
          note: 'Customer phone switched off and office gate closed for holiday',
        })
        .expect(200);

      expect(failRes.body.data.status).toBe(DeliveryStatus.FAILED);
      expect(failRes.body.data.attemptCount).toBe(1);

      // Reschedule
      const reschRes = await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryA2Id}/reschedule`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          scheduledDate: new Date().toISOString(),
          scheduledTimeFrom: '11:00',
          scheduledTimeTo: '14:00',
          reason: 'Customer requested delivery next working day morning',
        })
        .expect(200);

      expect(reschRes.body.data.status).toBe(DeliveryStatus.SCHEDULED);
      expect(reschRes.body.data.rescheduleHistory.length).toBe(1);
    });

    it('3.9 should cancel delivery request with audit notes', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryA2Id}/cancel`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          reason: 'Customer requested to collect from store counter instead',
        })
        .expect(200);

      expect(res.body.data.status).toBe(DeliveryStatus.CANCELLED);
      expect(res.body.data.cancellationReason).toContain('collect from store counter');
    });

    it('3.10 should reject cancelling already delivered delivery', async () => {
      await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryA1Id}/cancel`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ reason: 'Try cancel delivered job' })
        .expect(400);
    });

    it('3.11 should reject rescheduling delivered delivery', async () => {
      await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryA1Id}/reschedule`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ newDate: new Date().toISOString() })
        .expect(400);
    });
  });

  // ==========================================
  // 4. DOORSTEP PAYMENT & CASH COLLECTION
  // ==========================================
  describe('4. Doorstep Payment & Cash Collection Tracking', () => {
    let orderForPaymentId: string;
    let deliveryForPaymentId: string;

    it('4.1 should record doorstep collection and update order ledger balance', async () => {
      // Create new category & product
      const catRes = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Curtains Category' })
        .expect(201);
      const catId = catRes.body.data._id || catRes.body.data.id;

      const prodRes = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Curtains & Drapes',
          categoryId: catId,
          sku: 'SKU-CUR-500',
          unit: UnitType.PIECE,
          prices: { regular: 500, express: 750, sameDay: 1000 },
        })
        .expect(201);
      const prodId = prodRes.body.data._id || prodRes.body.data.id;

      // Create new order with ₹1000 total (2 * 500)
      const ordRes = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          customerId: customerAId,
          pricingTier: PricingTier.REGULAR,
          items: [{ productId: prodId, quantity: 2 }],
        })
        .expect(201);
      orderForPaymentId = ordRes.body.data._id || ordRes.body.data.id;
      const expectedTotal = ordRes.body.data.grandTotal;
      expect(expectedTotal).toBeGreaterThanOrEqual(1000);
      expect(ordRes.body.data.dueAmount).toBe(expectedTotal);

      // Create delivery for this order
      const delRes = await request(app.getHttpServer())
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          orderId: orderForPaymentId,
          customerId: customerAId,
          deliveryAddress: {
            name: 'Pooja Hegde',
            phone: '+919988776611',
            addressLine1: 'Flat 402, Sea Breeze Tower',
            area: 'Bandra West',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400050',
          },
          scheduledDate: new Date().toISOString(),
        })
        .expect(201);
      deliveryForPaymentId = delRes.body.data._id || delRes.body.data.id;

      // Assign & Start
      await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryForPaymentId}/assign`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ assignedAgentId: agentAId })
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryForPaymentId}/start`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      // Record cash collection at doorstep
      const colRes = await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryForPaymentId}/collection`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          amount: expectedTotal,
          paymentMethod: PaymentMethod.CASH,
          notes: `Collected exact cash ₹${expectedTotal} from customer at doorstep`,
        })
        .expect(200);

      expect(colRes.body.data.collectionAmount).toBe(expectedTotal);
      expect(colRes.body.data.collectionPaymentId).toBeDefined();

      // Verify order ledger reflects payment
      const updatedOrd = await request(app.getHttpServer())
        .get(`/api/orders/${orderForPaymentId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(updatedOrd.body.data.paidAmount).toBe(expectedTotal);
      expect(updatedOrd.body.data.dueAmount).toBe(0);
      expect(updatedOrd.body.data.paymentStatus).toBe('PAID');
    });

    it('4.2 should reject collection amount exceeding order due balance', async () => {
      // Trying to collect more when due is ₹0
      await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryForPaymentId}/collection`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          amount: 500,
          paymentMethod: PaymentMethod.CASH,
        })
        .expect(400);
    });

    it('4.3 should prevent duplicate collection on the same delivery', async () => {
      await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryForPaymentId}/collection`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          amount: 100,
          paymentMethod: PaymentMethod.CASH,
        })
        .expect(400);
    });
  });

  // ==========================================
  // 5. LOGISTICS AGENTS & DASHBOARD
  // ==========================================
  describe('5. Logistics Agents & Operations Dashboard', () => {
    it('5.1 should fetch active delivery agents with assigned workload counts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/logistics/agents')
        .query({ branchId: branchA1Id })
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      const agentObj = res.body.data.find((a: any) => a.agentId === agentAId);
      expect(agentObj).toBeDefined();
      expect(agentObj.name).toContain('Suresh');
      expect(agentObj.todayAssignedPickups).toBeGreaterThanOrEqual(1);
    });

    it('5.2 should return comprehensive logistics operational dashboard metrics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/logistics/dashboard')
        .query({ branchId: branchA1Id })
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.todayPickupsCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.todayDeliveriesCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.totalCashCollectedToday).toBeGreaterThanOrEqual(1000);
      expect(res.body.data.agents).toBeDefined();
    });

    it('5.3 should allow delivery agent to retrieve their own job queue', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/logistics/my-jobs')
        .set('Authorization', `Bearer ${agentAToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.summary).toBeDefined();
      expect(Array.isArray(res.body.data.pickups)).toBe(true);
      expect(Array.isArray(res.body.data.deliveries)).toBe(true);
    });
  });

  // ==========================================
  // 6. MULTI-TENANT & BRANCH SECURITY ISOLATION
  // ==========================================
  describe('6. Multi-Tenant & Branch Security Isolation', () => {
    it('6.1 Tenant B cannot view Tenant A pickup (404/403 Isolation)', async () => {
      await request(app.getHttpServer())
        .get(`/api/pickups/${pickupA1Id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('6.2 Tenant B cannot view Tenant A delivery (404/403 Isolation)', async () => {
      await request(app.getHttpServer())
        .get(`/api/deliveries/${deliveryA1Id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('6.3 Tenant B cannot assign or modify Tenant A pickup', async () => {
      await request(app.getHttpServer())
        .post(`/api/pickups/${pickupA1Id}/assign`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ assignedAgentId: agentBId })
        .expect(404);
    });

    it('6.4 Tenant B cannot complete or modify Tenant A delivery', async () => {
      await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryA1Id}/complete`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('6.5 Tenant A cannot link Tenant B order to a delivery request (Cross-Tenant Protection)', async () => {
      await request(app.getHttpServer())
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          orderId: orderBId, // Belongs to Tenant B
          customerId: customerAId,
          deliveryAddress: {
            name: 'Pooja Hegde',
            addressLine1: 'Bandra West',
            area: 'Bandra',
            city: 'Mumbai',
            pincode: '400050',
          },
          scheduledDate: new Date().toISOString(),
        })
        .expect(404);
    });

    it('6.6 Tenant A cannot link Tenant B customer to a pickup request (Cross-Tenant Protection)', async () => {
      await request(app.getHttpServer())
        .post('/api/pickups')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          customerId: customerBId, // Belongs to Tenant B
          pickupAddress: {
            name: 'Karan Johar',
            addressLine1: 'Juhu',
            area: 'Juhu',
            city: 'Mumbai',
            pincode: '400049',
          },
          scheduledDate: new Date().toISOString(),
        })
        .expect(404);
    });

    it('6.7 should reject assigning agent belonging to another tenant', async () => {
      // Create pickup in Tenant A and attempt to assign Tenant B's agent
      const puRes = await request(app.getHttpServer())
        .post('/api/pickups')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          customerId: customerAId,
          pickupAddress: {
            name: 'Pooja Hegde',
            addressLine1: 'Bandra',
            area: 'Bandra',
            city: 'Mumbai',
            pincode: '400050',
          },
          scheduledDate: new Date().toISOString(),
        })
        .expect(201);
      const puAId = puRes.body.data._id || puRes.body.data.id;

      await request(app.getHttpServer())
        .post(`/api/pickups/${puAId}/assign`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ assignedAgentId: agentBId }) // Belongs to Tenant B
        .expect(400);
    });

    it('6.8 Tenant B cannot submit proof for Tenant A delivery', async () => {
      await request(app.getHttpServer())
        .post(`/api/deliveries/${deliveryA1Id}/proof`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ recipientName: 'Intruder' })
        .expect(404);
    });

    it('6.9 should reject delivery creation with non-existent customer', async () => {
      await request(app.getHttpServer())
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          orderId: orderAId,
          customerId: '507f1f77bcf86cd799439011',
          deliveryAddress: {
            name: 'Ghost',
            addressLine1: 'Unknown',
            city: 'Mumbai',
          },
          scheduledDate: new Date().toISOString(),
        })
        .expect(404);
    });
  });

  // ==========================================
  // 7. AUDIT LOGGING VERIFICATION
  // ==========================================
  describe('7. Audit Logging Verification', () => {
    it('7.1 should verify pickup and delivery mutations generated audit logs', async () => {
      const auditService = app.get(AuditService);
      const auditLogs = await auditService.findByTenant(tenantAId);

      expect(auditLogs.items.length).toBeGreaterThan(0);
      const actions = auditLogs.items.map((l: any) => l.action);

      expect(actions).toContain('PICKUP_CREATED');
      expect(actions).toContain('PICKUP_ASSIGNED');
      expect(actions).toContain('DELIVERY_CREATED');
      expect(actions).toContain('DELIVERY_ASSIGNED');
      expect(actions).toContain('DELIVERY_COMPLETED');
      expect(actions).toContain('DELIVERY_COLLECTION_RECORDED');
    });

    it('7.2 should verify failure and reschedule operations generated audit logs', async () => {
      const auditService = app.get(AuditService);
      const auditLogs = await auditService.findByTenant(tenantAId);

      const actions = auditLogs.items.map((l: any) => l.action);
      expect(actions).toContain('PICKUP_FAILED');
      expect(actions).toContain('PICKUP_RESCHEDULED');
      expect(actions).toContain('DELIVERY_FAILED');
      expect(actions).toContain('DELIVERY_RESCHEDULED');
    });
  });
});
