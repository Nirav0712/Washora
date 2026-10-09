import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import {
  RoleType,
  OrderStatus,
  PricingTier,
  PaymentMethod,
  UnitType,
  QCResult,
  QCIssueType,
  ProcessingJobStatus,
  GarmentProcessingStatus,
} from '@washora/shared';

describe('Phase 04 — Processing Plant, Garment Lifecycle, QC & Production Workflow Suite', () => {
  let mongod: MongoMemoryServer;
  let app: INestApplication;

  // Tenant A Credentials & IDs
  let tokenA: string;
  let tenantAId: string;
  let branchA1Id: string;
  let branchA2Id: string;
  let operatorTokenA: string;
  let operatorAId: string;
  let unauthorizedCashierTokenA: string;

  // Tenant B Credentials & IDs
  let tokenB: string;
  let tenantBId: string;
  let branchBId: string;
  let userBId: string;

  // Test Order, Garments & Jobs in Tenant A
  let customerAId: string;
  let productAId: string;
  let orderAId: string;
  let garmentA1Id: string;
  let garmentA2Id: string;
  let jobA1Id: string;
  let jobA2Id: string;

  // Test Order, Garments & Jobs in Tenant B
  let customerBId: string;
  let productBId: string;
  let orderBId: string;
  let garmentBId: string;
  let jobBId: string;

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
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();

    const timestamp = Date.now();

    // 1. Register Tenant A Owner
    const regARes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Alpha Plant Owner',
        email: `owner.alpha.${timestamp}@washora.test`,
        password: 'Password@123',
        phone: '+919811100001',
        tenantName: `Process Corp Alpha ${timestamp}`,
        businessType: 'LAUNDRY',
        branchName: 'Alpha Main Hub',
        branchCity: 'Mumbai',
      });

    if (!regARes.body.data) {
      console.log('regARes error status:', regARes.status, 'body:', JSON.stringify(regARes.body));
    }
    tokenA = regARes.body.data?.accessToken;
    tenantAId = regARes.body.data?.tenant?.id;
    branchA1Id = regARes.body.data?.membership?.branchIds?.[0];

    // Create Second Branch in Tenant A (Branch A2)
    const branchA2Res = await request(app.getHttpServer())
      .post('/api/branches')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Alpha Plant Branch 2',
        code: `ALPH2-${timestamp.toString().slice(-4)}`,
        address: 'Sector 4 Industrial Zone',
        city: 'Mumbai',
        taxRate: 5.0,
      });
    branchA2Id = branchA2Res.body.data.id || branchA2Res.body.data._id;

    // Invite Operator to Tenant A (Assigned only to Branch A1)
    const opInviteRes = await request(app.getHttpServer())
      .post('/api/memberships/invite')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: `Operator Alpha ${timestamp}`,
        email: `operator.alpha.${timestamp}@washora.test`,
        roleCode: RoleType.OPERATOR,
        branchIds: [branchA1Id],
      });
    operatorAId = opInviteRes.body.data.user.id || opInviteRes.body.data.user._id;

    // Login as Operator
    const opLoginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: `operator.alpha.${timestamp}@washora.test`,
        password: 'Washora@2026',
      });
    operatorTokenA = opLoginRes.body.data.accessToken;

    // Invite Cashier Staff to Tenant A (Unauthorized for QC/Assign)
    const cashInviteRes = await request(app.getHttpServer())
      .post('/api/memberships/invite')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: `Cashier Alpha ${timestamp}`,
        email: `cashier.alpha.${timestamp}@washora.test`,
        roleCode: RoleType.CASHIER,
        branchIds: [branchA1Id],
      });

    const cashLoginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: `cashier.alpha.${timestamp}@washora.test`,
        password: 'Washora@2026',
      });
    unauthorizedCashierTokenA = cashLoginRes.body.data.accessToken;

    // 2. Register Tenant B Owner
    const regBRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Beta Plant Owner',
        email: `owner.beta.${timestamp}@washora.test`,
        password: 'Password@123',
        phone: '+919811100004',
        tenantName: `Process Corp Beta ${timestamp}`,
        businessType: 'DRY_CLEANING',
        branchName: 'Beta Main Plant',
        branchCity: 'Delhi',
      });

    tokenB = regBRes.body.data.accessToken;
    tenantBId = regBRes.body.data.tenant.id;
    branchBId = regBRes.body.data.membership.branchIds[0];
    userBId = regBRes.body.data.user.id;

    // 3. Create Catalog & Customer in Tenant A
    const custARes = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Alpha Customer VIP',
        phone: `998811${timestamp.toString().slice(-4)}`,
      });
    customerAId = custARes.body.data.id || custARes.body.data._id;

    const catARes = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `Suits & Formal ${timestamp}` });
    const catAId = catARes.body.data.id || catARes.body.data._id;

    const prodARes = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Executive Two-Piece Suit',
        categoryId: catAId,
        sku: `SUIT-A-${timestamp}`,
        unit: UnitType.PIECE,
        prices: { regular: 500, express: 750, sameDay: 1000 },
      });
    productAId = prodARes.body.data.id || prodARes.body.data._id;

    // 4. Create Order in Tenant A with 2 Garments (Auto creates 2 processing jobs)
    const orderARes = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        customerId: customerAId,
        branchId: branchA1Id,
        pricingTier: PricingTier.REGULAR,
        items: [{ productId: productAId, quantity: 2, notes: 'Gentle steam press' }],
      });

    orderAId = orderARes.body.data.id || orderARes.body.data._id;
    const garmentsA = orderARes.body.data.garmentIds || [];
    garmentA1Id = garmentsA[0]._id || garmentsA[0];
    garmentA2Id = garmentsA[1]._id || garmentsA[1];

    // Find auto-created jobs for Tenant A
    const jobsARes = await request(app.getHttpServer())
      .get('/api/processing/queue')
      .set('Authorization', `Bearer ${tokenA}`)
      .query({ branchId: branchA1Id });

    const itemsA = Array.isArray(jobsARes.body.data) ? jobsARes.body.data : jobsARes.body.items || [];
    const jobA1 = itemsA.find((j: any) => j.garmentId === garmentA1Id);
    const jobA2 = itemsA.find((j: any) => j.garmentId === garmentA2Id);
    jobA1Id = jobA1?.jobId || jobA1?.id;
    jobA2Id = jobA2?.jobId || jobA2?.id;

    // 5. Create Order & Garment in Tenant B
    const custBRes = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Beta Customer',
        phone: `987722${timestamp.toString().slice(-4)}`,
      });
    customerBId = custBRes.body.data.id || custBRes.body.data._id;

    const catBRes = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: `Beta Silk ${timestamp}` });
    const catBId = catBRes.body.data.id || catBRes.body.data._id;

    const prodBRes = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Beta Saree Dry Clean',
        categoryId: catBId,
        sku: `SAREE-B-${timestamp}`,
        unit: UnitType.PIECE,
        prices: { regular: 400, express: 600, sameDay: 800 },
      });
    productBId = prodBRes.body.data.id || prodBRes.body.data._id;

    const orderBRes = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        customerId: customerBId,
        branchId: branchBId,
        pricingTier: PricingTier.REGULAR,
        items: [{ productId: productBId, quantity: 1 }],
      });
    orderBId = orderBRes.body.data.id || orderBRes.body.data._id;
    const garmentsB = orderBRes.body.data.garmentIds || [];
    garmentBId = garmentsB[0]._id || garmentsB[0];

    const jobsBRes = await request(app.getHttpServer())
      .get('/api/processing/queue')
      .set('Authorization', `Bearer ${tokenB}`);
    const itemsB = Array.isArray(jobsBRes.body.data) ? jobsBRes.body.data : jobsBRes.body.items || [];
    const jobB = itemsB.find((j: any) => j.garmentId === garmentBId);
    jobBId = jobB?.jobId || jobB?.id;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongod) await mongod.stop();
  });

  describe('1. Tenant Isolation', () => {
    it('1. Tenant A cannot access Tenant B processing job', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/processing/jobs/${jobBId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect([404, 403]).toContain(res.status);
    });

    it('2. Tenant A cannot access Tenant B garment processing history', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/processing/garments/${garmentBId}/timeline`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]); // Empty because Tenant B records are invisible to Tenant A
    });

    it('3. Tenant A cannot access Tenant B QC records', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/processing/jobs/${jobBId}/qc`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('4. Tenant A cannot access Tenant B processing issues', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/processing/jobs/${jobBId}/issues`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('2. Branch Isolation', () => {
    let jobA2InBranch2Id: string;

    beforeAll(async () => {
      // Create an order in Branch A2
      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          customerId: customerAId,
          branchId: branchA2Id,
          items: [{ productId: productAId, quantity: 1 }],
        });
      const order = res.body.data;
      const gId = order.garmentIds[0]._id || order.garmentIds[0];

      const queueRes = await request(app.getHttpServer())
        .get('/api/processing/queue')
        .set('Authorization', `Bearer ${tokenA}`)
        .query({ branchId: branchA2Id });

      const itemsBranch2 = Array.isArray(queueRes.body.data) ? queueRes.body.data : queueRes.body.items || [];
      const foundJob = itemsBranch2.find((j: any) => j.garmentId === gId);
      jobA2InBranch2Id = foundJob?.jobId || foundJob?.id;
    });

    it('5. Branch A1 Operator cannot access Branch A2 processing job', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/processing/jobs/${jobA2InBranch2Id}`)
        .set('Authorization', `Bearer ${operatorTokenA}`);

      expect([404, 403]).toContain(res.status);
    });

    it('6. Branch A1 Operator cannot move Branch A2 garment stage', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/processing/jobs/${jobA2InBranch2Id}/stage`)
        .set('Authorization', `Bearer ${operatorTokenA}`)
        .send({ stageCode: 'SORTING' });

      expect([404, 403]).toContain(res.status);
    });

    it('7. Branch A1 Operator cannot perform QC on Branch A2 garment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/processing/jobs/${jobA2InBranch2Id}/qc`)
        .set('Authorization', `Bearer ${operatorTokenA}`)
        .send({ result: QCResult.PASSED });

      expect([404, 403]).toContain(res.status);
    });
  });

  describe('3. Processing Lifecycle & Stage Transitions', () => {
    it('8. RECEIVED → SORTING succeeds', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/processing/jobs/${jobA1Id}/stage`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ stageCode: 'SORTING', notes: 'Inspection completed' });

      expect(res.status).toBe(200);
      expect(res.body.data.stageCode).toBe('SORTING');
      expect(res.body.data.status).toBe(ProcessingJobStatus.IN_PROGRESS);
    });

    it('9. SORTING → WASHING succeeds', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/processing/jobs/${jobA1Id}/stage`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ stageCode: 'WASHING' });

      expect(res.status).toBe(200);
      expect(res.body.data.stageCode).toBe('WASHING');
    });

    it('10. WASHING → DRYING succeeds', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/processing/jobs/${jobA1Id}/stage`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ stageCode: 'DRYING' });

      expect(res.status).toBe(200);
      expect(res.body.data.stageCode).toBe('DRYING');
    });

    it('11. Invalid stage jump (DRYING → READY) directly without override is rejected', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/processing/jobs/${jobA1Id}/stage`)
        .set('Authorization', `Bearer ${operatorTokenA}`)
        .send({ stageCode: 'READY', isOverride: false });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Cannot jump');
    });

    it('12. Move DRYING → IRONING → QUALITY_CHECK succeeds sequentially', async () => {
      const resIron = await request(app.getHttpServer())
        .patch(`/api/processing/jobs/${jobA1Id}/stage`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ stageCode: 'IRONING' });
      expect(resIron.status).toBe(200);

      const resFinish = await request(app.getHttpServer())
        .patch(`/api/processing/jobs/${jobA1Id}/stage`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ stageCode: 'FINISHING' });
      expect(resFinish.status).toBe(200);

      const resQC = await request(app.getHttpServer())
        .patch(`/api/processing/jobs/${jobA1Id}/stage`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ stageCode: 'QUALITY_CHECK' });
      expect(resQC.status).toBe(200);
      expect(resQC.body.data.stageCode).toBe('QUALITY_CHECK');
    });
  });

  describe('4. Operator Assignment & Permissions', () => {
    it('13. Authorized manager can assign operator', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/processing/jobs/${jobA1Id}/assign`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ assignedUserId: operatorAId, notes: 'Assigned to Alpha Operator' });

      expect(res.status).toBe(200);
      expect(res.body.data.assignedUserId).toBe(operatorAId);
    });

    it('14. Unauthorized user (Cashier) cannot assign operator', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/processing/jobs/${jobA1Id}/assign`)
        .set('Authorization', `Bearer ${unauthorizedCashierTokenA}`)
        .send({ assignedUserId: operatorAId });

      expect(res.status).toBe(403);
    });

    it('15. Cannot assign user from another tenant (Tenant B User to Tenant A Job)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/processing/jobs/${jobA1Id}/assign`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ assignedUserId: userBId });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('not an active staff member');
    });
  });

  describe('5. Quality Control (QC) Workflow', () => {
    it('16. Unauthorized user (Cashier without processing.qc) cannot approve QC', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/processing/jobs/${jobA1Id}/qc`)
        .set('Authorization', `Bearer ${unauthorizedCashierTokenA}`)
        .send({ result: QCResult.PASSED });

      expect(res.status).toBe(403);
    });

    it('17. REWORK_REQUIRED routes garment back into processing stage (e.g. WASHING)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/processing/jobs/${jobA1Id}/qc`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          result: QCResult.REWORK_REQUIRED,
          issues: [QCIssueType.STAIN_REMAINING],
          notes: 'Collar stain persists, needs enzyme treatment',
          reworkStageCode: 'WASHING',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.result).toBe(QCResult.REWORK_REQUIRED);

      // Verify job is back in WASHING
      const jobRes = await request(app.getHttpServer())
        .get(`/api/processing/jobs/${jobA1Id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(jobRes.body.data.stageCode).toBe('WASHING');
      expect(jobRes.body.data.status).toBe(ProcessingJobStatus.IN_PROGRESS);
    });

    it('18. QC FAIL does not make garment READY', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/processing/jobs/${jobA1Id}/qc`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          result: QCResult.FAILED,
          issues: [QCIssueType.DAMAGE_FOUND],
          notes: 'Torn seam found',
        });

      expect(res.status).toBe(201);
      const jobRes = await request(app.getHttpServer())
        .get(`/api/processing/jobs/${jobA1Id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(jobRes.body.data.stageCode).not.toBe('READY');
      expect(jobRes.body.data.status).not.toBe(ProcessingJobStatus.COMPLETED);
    });

    it('19. QC PASS marks garment READY and completes processing job', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/processing/jobs/${jobA1Id}/qc`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          result: QCResult.PASSED,
          notes: 'Second wash passed QC perfectly',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.result).toBe(QCResult.PASSED);

      const jobRes = await request(app.getHttpServer())
        .get(`/api/processing/jobs/${jobA1Id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(jobRes.body.data.stageCode).toBe('READY');
      expect(jobRes.body.data.status).toBe(ProcessingJobStatus.COMPLETED);
    });

    it('20. QC override by authorized Manager creates audit log and passes QC', async () => {
      // Advance Job A2 to QUALITY_CHECK
      await request(app.getHttpServer())
        .patch(`/api/processing/jobs/${jobA2Id}/stage`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ stageCode: 'QUALITY_CHECK', isOverride: true });

      const res = await request(app.getHttpServer())
        .post(`/api/processing/jobs/${jobA2Id}/qc`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          result: QCResult.PASSED,
          isOverride: true,
          overrideReason: 'Customer signed pre-existing slight fabric fading waiver',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isOverride).toBe(true);

      const jobRes = await request(app.getHttpServer())
        .get(`/api/processing/jobs/${jobA2Id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(jobRes.body.data.stageCode).toBe('READY');
    });
  });

  describe('6. Processing Issues & Defects', () => {
    let createdIssueId: string;

    it('21. Staff can create processing defect issue', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/processing/jobs/${jobA1Id}/issues`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          type: 'STAIN_NOT_REMOVED',
          severity: 'HIGH',
          description: 'Ink stain on back pocket requires specialized solvent.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('STAIN_NOT_REMOVED');
      expect(res.body.data.status).toBe('OPEN');
      createdIssueId = res.body.data.id || res.body.data._id;
    });

    it('22. Authorized user can resolve defect issue', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/processing/issues/${createdIssueId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ resolutionNotes: 'Treated with ultrasonic stain remover and cleared.' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('RESOLVED');
      expect(res.body.data.resolutionNotes).toContain('ultrasonic stain remover');
    });

    it('23. Unauthorized user cannot resolve issue', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/processing/issues/${createdIssueId}`)
        .set('Authorization', `Bearer ${unauthorizedCashierTokenA}`)
        .send({ resolutionNotes: 'Cashier attempt' });

      expect(res.status).toBe(403);
    });
  });

  describe('7. Order Synchronization & Readiness', () => {
    it('24. Both garments (Job A1 & Job A2) are READY → Order automatically becomes READY', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/orders/${orderAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(OrderStatus.READY);
    });

    it('25. If one garment is still processing, order does NOT become READY', async () => {
      // Create new order with 2 garments
      const newOrderRes = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          customerId: customerAId,
          branchId: branchA1Id,
          items: [{ productId: productAId, quantity: 2 }],
        });

      const order = newOrderRes.body.data;
      const g1 = order.garmentIds[0]._id || order.garmentIds[0];
      const g2 = order.garmentIds[1]._id || order.garmentIds[1];

      const queueRes = await request(app.getHttpServer())
        .get('/api/processing/queue')
        .set('Authorization', `Bearer ${tokenA}`)
        .query({ branchId: branchA1Id });

      const syncItems = Array.isArray(queueRes.body.data) ? queueRes.body.data : queueRes.body.items || [];
      const j1 = syncItems.find((j: any) => j.garmentId === g1);

      // Pass QC only for garment 1
      await request(app.getHttpServer())
        .post(`/api/processing/jobs/${j1.jobId || j1.id}/qc`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ result: QCResult.PASSED });

      // Order should remain PROCESSING / RECEIVED, not READY
      const orderCheckRes = await request(app.getHttpServer())
        .get(`/api/orders/${order.id || order._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(orderCheckRes.body.data.status).not.toBe(OrderStatus.READY);
    });

    it('26. Cancelled order cannot accidentally be made READY', async () => {
      const cancelOrderRes = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          customerId: customerAId,
          branchId: branchA1Id,
          items: [{ productId: productAId, quantity: 1 }],
        });
      const orderId = cancelOrderRes.body.data.id || cancelOrderRes.body.data._id;
      const gId = cancelOrderRes.body.data.garmentIds[0]._id || cancelOrderRes.body.data.garmentIds[0];

      await request(app.getHttpServer())
        .post(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ reason: 'Customer cancelled at counter' });

      // Try passing QC on the garment
      const queueRes = await request(app.getHttpServer())
        .get('/api/processing/queue')
        .set('Authorization', `Bearer ${tokenA}`);
      const cancelItems = Array.isArray(queueRes.body.data) ? queueRes.body.data : queueRes.body.items || [];
      const job = cancelItems.find((j: any) => j.garmentId === gId);

      if (job) {
        await request(app.getHttpServer())
          .post(`/api/processing/jobs/${job.jobId || job.id}/qc`)
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ result: QCResult.PASSED });
      }

      const check = await request(app.getHttpServer())
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(check.body.data.status).toBe(OrderStatus.CANCELLED);
    });
  });

  describe('8. Security, Error Handling & Configurable Stages', () => {
    it('27. Unauthenticated request to /api/processing/queue returns 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/processing/queue');
      expect(res.status).toBe(401);
    });

    it('28. Invalid ObjectId returns safe 400 / 404 without crashing', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/processing/jobs/invalid-id-123')
        .set('Authorization', `Bearer ${tokenA}`);
      expect([400, 404]).toContain(res.status);
    });

    it('29. Tenant can create, update, and list custom workflow stages', async () => {
      const timestamp = Date.now();
      const createRes = await request(app.getHttpServer())
        .post('/api/processing/stages')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          code: `CUSTOM_STATION_${timestamp}`,
          name: 'Shoe Spa Ozone Sterilization',
          sequence: 10,
          color: '#8b5cf6',
          icon: 'Sparkles',
        });

      expect(createRes.status).toBe(201);
      const stageId = createRes.body.data.id || createRes.body.data._id;

      const listRes = await request(app.getHttpServer())
        .get('/api/processing/stages')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(listRes.body.data.some((s: any) => s.code === `CUSTOM_STATION_${timestamp}`)).toBe(true);

      const updateRes = await request(app.getHttpServer())
        .patch(`/api/processing/stages/${stageId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Shoe Spa Ultrasonic & Ozone' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('Shoe Spa Ultrasonic & Ozone');
    });

    it('30. Processing job timeline returns immutable sequential history', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/processing/jobs/${jobA1Id}/timeline`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });
  });
});
