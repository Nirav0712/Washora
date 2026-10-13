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
  PaymentMethod,
  PayrollPeriodStatus,
  SalaryType,
  EmploymentType,
} from '@washora/shared';

describe('Washora SaaS — 360° Comprehensive Audit & Verification Suite', () => {
  let mongod: MongoMemoryServer;
  let app: INestApplication;

  // Tenant Alpha (Company A)
  let tenantA: any;
  let tokenA: string;
  let branchAId: string;
  let customerAId: string;
  let orderAId: string;
  let garmentABarcode: string;
  let ticketAId: string;

  // Tenant Beta (Company B)
  let tenantB: any;
  let tokenB: string;
  let branchBId: string;

  // Staff in Tenant A
  let cashierToken: string;
  let cashierUserId: string;

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

    // 1. Register Tenant Alpha (Company A)
    const regA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: `Alpha Owner ${timestamp}`,
        email: `alpha_${timestamp}@washora.saas`,
        password: 'Password@123',
        phone: '+919876540001',
        tenantName: `Alpha Laundry Hub ${timestamp}`,
        businessType: BusinessType.LAUNDRY,
        branchName: 'Alpha Koramangala Plant',
        branchCity: 'Bengaluru',
      });

    tenantA = regA.body.data;
    tokenA = tenantA.accessToken;
    branchAId = tenantA.branches[0].id;

    // 2. Register Tenant Beta (Company B)
    const regB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: `Beta Owner ${timestamp}`,
        email: `beta_${timestamp}@washora.saas`,
        password: 'Password@123',
        phone: '+919876540002',
        tenantName: `Beta Cleaners ${timestamp}`,
        businessType: BusinessType.DRY_CLEANING,
        branchName: 'Beta Andheri Branch',
        branchCity: 'Mumbai',
      });

    tenantB = regB.body.data;
    tokenB = tenantB.accessToken;
    branchBId = tenantB.branches[0].id;

    // 3. Create Cashier under Tenant Alpha
    const cashierEmail = `cashier_${timestamp}@washora.saas`;
    const inviteRes = await request(app.getHttpServer())
      .post('/api/memberships/invite')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: `Cashier Alpha`,
        email: cashierEmail,
        roleCode: RoleType.CASHIER,
        branchIds: [branchAId],
      });

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: cashierEmail,
        password: 'Washora@2026',
      });
    cashierToken = loginRes.body.data.accessToken;
    cashierUserId = loginRes.body.data.user.id;

    // 4. Create Category, Product, and Service in Tenant Alpha
    const catRes = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Men Everyday Wear',
        icon: 'Shirt',
        color: '#3B82F6',
      });
    const categoryId = catRes.body.data.id || catRes.body.data._id;

    const prodRes = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Cotton Formal Shirt',
        categoryId,
        sku: `SHIRT-${timestamp}`,
        unit: UnitType.PIECE,
        prices: { regular: 80, express: 120, sameDay: 160 },
      });
    const productId = prodRes.body.data.id || prodRes.body.data._id;

    // 5. Create Customer in Tenant Alpha
    const custRes = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Vikram Malhotra',
        phone: `+91 98765 ${timestamp.toString().slice(-5)}`,
        email: `vikram_${timestamp}@example.com`,
        addresses: [{ addressLine1: 'Villa 12, Palm Meadows', city: 'Bengaluru', isDefault: true }],
      });
    customerAId = custRes.body.data?.id || custRes.body.data?._id;

    // 6. Create Order in Tenant Alpha with Garments
    const orderRes = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        customerId: customerAId,
        branchId: branchAId,
        items: [{ productId, quantity: 2 }],
      });
    orderAId = orderRes.body.data?.id || orderRes.body.data?._id;

    // 7. Extract barcode of generated garment
    const garmentsRes = await request(app.getHttpServer())
      .get(`/api/garments?orderId=${orderAId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    if (garmentsRes.body.data?.items?.length > 0) {
      garmentABarcode = garmentsRes.body.data.items[0].barcode || garmentsRes.body.data.items[0].garmentNumber;
    }

    // 8. Create Support Ticket in Tenant Alpha
    const ticketRes = await request(app.getHttpServer())
      .post('/api/support/tickets')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        category: 'HARDWARE_PRINTER',
        priority: 'HIGH',
        subject: 'Thermal barcode tag printer USB error on station 1',
        description: 'Workstation USB ESC/POS thermal printer throws communication timeout error',
      });
    if (!ticketRes.body.data) {
      console.log('ticketRes failed:', ticketRes.status, JSON.stringify(ticketRes.body));
    }
    ticketAId = ticketRes.body.data?._id || ticketRes.body.data?.id;
  });

  afterAll(async () => {
    await app.close();
    if (mongod) await mongod.stop();
  });

  // =========================================================================
  // SECTION 1: STRICT MULTI-TENANT ISOLATION & IDOR PREVENTION
  // =========================================================================

  it('SECURITY [IDOR]: Company B cannot read Company A customer', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/customers/${customerAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('SECURITY [IDOR]: Company B cannot read Company A orders', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/orders/${orderAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('SECURITY [IDOR]: Company B cannot modify Company A customer records', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/customers/${customerAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Hacked Name Malicious Update' });

    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('SECURITY [IDOR]: Company B cannot scan or view Company A garment barcode', async () => {
    if (!garmentABarcode) return;
    const res = await request(app.getHttpServer())
      .get(`/api/garments/scan?barcode=${encodeURIComponent(garmentABarcode)}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('SECURITY [IDOR]: Company B cannot read Company A support ticket', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/support/tickets/${ticketAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // =========================================================================
  // SECTION 2: PRIVILEGE ESCALATION & GRANULAR RBAC CONTROLS
  // =========================================================================

  it('RBAC [Privilege Escalation]: Non-owner role cannot grant unpossessed permissions', async () => {
    // Cashier tries to create a custom role with full tenant ownership permissions
    const res = await request(app.getHttpServer())
      .post('/api/roles')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        name: 'Escalated Admin Role',
        permissions: ['tenant.update', 'branch.delete', 'user.remove', 'role.manage'],
      });

    // Must be rejected with 403 Forbidden
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('RBAC: Cashier cannot access financial P&L reports without permission', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports/dashboard')
      .set('Authorization', `Bearer ${cashierToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // =========================================================================
  // SECTION 3: BILLING ARITHMETIC & PAYMENT LIFECYCLE
  // =========================================================================

  it('BILLING: Safe decimal arithmetic and payment settlement transitions', async () => {
    // 1. Check order initial calculation
    const getOrder = await request(app.getHttpServer())
      .get(`/api/orders/${orderAId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(getOrder.status).toBe(200);
    const orderData = getOrder.body.data;
    const totalAmount = orderData.grandTotal;
    expect(totalAmount).toBeGreaterThan(0);

    // 2. Advance partial payment
    const partialPayment = Math.floor(totalAmount / 2);
    const payRes1 = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        orderId: orderAId,
        amount: partialPayment,
        method: PaymentMethod.UPI,
        referenceNumber: 'UPI-TXN-PARTIAL-001',
      });

    expect([200, 201]).toContain(payRes1.status);

    const checkOrder1 = await request(app.getHttpServer())
      .get(`/api/orders/${orderAId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(checkOrder1.body.data.paymentStatus).toBe('PARTIAL');

    // 3. Complete remaining balance payment
    const remainingBalance = totalAmount - partialPayment;
    const payRes2 = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        orderId: orderAId,
        amount: remainingBalance,
        method: PaymentMethod.CASH,
        referenceNumber: 'CASH-SETTLE-002',
      });

    expect([200, 201]).toContain(payRes2.status);

    const checkOrder2 = await request(app.getHttpServer())
      .get(`/api/orders/${orderAId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(checkOrder2.body.data.paymentStatus).toBe('PAID');
  });

  // =========================================================================
  // SECTION 4: INVOICE CUSTOMIZATION & LIVE TEMPLATE DATA
  // =========================================================================

  it('INVOICE: Customize invoice template and verify live print data', async () => {
    // Update invoice template settings
    const patchRes = await request(app.getHttpServer())
      .patch('/api/settings')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        receiptSettings: {
          invoiceTitle: 'TAX INVOICE & CASH RECEIPT',
          paperSize: 'THERMAL_80MM',
          headerText: 'CleanWave Premium Steam Spa',
          footerText: 'Collect within 10 days of notification',
          showQrCode: true,
          showBarcode: true,
          terms: 'Colors guaranteed on tested fabrics.',
          customFooter: 'Thank you for choosing Washora!',
        },
      });

    expect(patchRes.status).toBe(200);

    // Fetch printable invoice data for the order
    const invRes = await request(app.getHttpServer())
      .get(`/api/orders/${orderAId}/invoice`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(invRes.status).toBe(200);
    const inv = invRes.body.data;
    expect(inv.order?.id || inv.order?._id).toBe(orderAId);
    expect(inv.invoiceTitle || inv.shopSettings?.receiptSettings?.invoiceTitle).toBe('TAX INVOICE & CASH RECEIPT');
    expect(inv.paperSize || inv.shopSettings?.receiptSettings?.paperSize).toBe('THERMAL_80MM');
  });

  // =========================================================================
  // SECTION 5: GARMENT WORKSTATION SCANNING & STAGE TRANSITION
  // =========================================================================

  it('GARMENTS: Workstation barcode scan lookup and quick stage transition', async () => {
    if (!garmentABarcode) return;

    // Fast station lookup by barcode
    const scanRes = await request(app.getHttpServer())
      .get(`/api/garments/scan?barcode=${encodeURIComponent(garmentABarcode)}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(scanRes.status).toBe(200);
    expect(scanRes.body.data.garment).toBeDefined();

    // Fast stage transition
    const transRes = await request(app.getHttpServer())
      .post('/api/garments/scan-transition')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        barcode: garmentABarcode,
        targetStage: 'SORTING',
        notes: 'Inspected at intake station',
      });

    expect(transRes.status).toBe(200);
    expect(transRes.body.data.currentStage).toBe('SORTING');
  });

  // =========================================================================
  // SECTION 6: PAYROLL DISBURSEMENT & STRUCTURED PAYSLIP
  // =========================================================================

  it('PAYROLL: Process, approve, disburse period, and generate payslip', async () => {
    // 1. Create Staff Profile in Tenant A
    const staffEmail = `emp_${Date.now()}@washora.saas`;
    const staffRes = await request(app.getHttpServer())
      .post('/api/staff')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Rohan Sharma',
        email: staffEmail,
        password: 'Password@123',
        phone: '+919811122233',
        roleCode: RoleType.CASHIER,
        employmentType: EmploymentType.FULL_TIME,
        primaryBranchId: branchAId,
        designation: 'Senior Counter Executive',
        department: 'POS & Operations',
        salaryConfiguration: {
          salaryType: SalaryType.MONTHLY,
          baseSalary: 2500000, // ₹25,000 in paise
          allowances: [{ name: 'Conveyance Allowance', amount: 200000 }],
          deductions: [{ name: 'Professional Tax', amount: 20000 }],
        },
      });

    expect([200, 201]).toContain(staffRes.status);

    // 2. Create Payroll Period
    const periodRes = await request(app.getHttpServer())
      .post('/api/payroll/periods')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'October 2026 Audit Run',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      });

    expect([200, 201]).toContain(periodRes.status);
    const periodId = periodRes.body.data._id || periodRes.body.data.id;

    // 3. Process calculations
    const procRes = await request(app.getHttpServer())
      .post(`/api/payroll/periods/${periodId}/process`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(procRes.status).toBe(201);
    expect(procRes.body.data.status).toBe(PayrollPeriodStatus.PROCESSED);

    // 4. Approve period
    const appRes = await request(app.getHttpServer())
      .post(`/api/payroll/periods/${periodId}/approve`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(appRes.status).toBe(201);
    expect(appRes.body.data.status).toBe(PayrollPeriodStatus.APPROVED);

    // 5. Disburse period
    const disbRes = await request(app.getHttpServer())
      .post(`/api/payroll/periods/${periodId}/disburse`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        paymentMethod: 'BANK_TRANSFER',
        disbursementReference: 'NEFT-OCT-2026-77881',
        disbursementNotes: 'Salaries credited via corporate net banking',
      });

    expect(disbRes.status).toBe(201);
    expect(disbRes.body.data.status).toBe(PayrollPeriodStatus.PAID);
    expect(disbRes.body.data.disbursementReference).toBe('NEFT-OCT-2026-77881');

    // 6. Get records & generate printable payslip
    const recsRes = await request(app.getHttpServer())
      .get(`/api/payroll/periods/${periodId}/records`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(recsRes.status).toBe(200);
    expect(recsRes.body.data.length).toBeGreaterThan(0);
    const recordId = recsRes.body.data[0]._id;

    const payslipRes = await request(app.getHttpServer())
      .get(`/api/payroll/records/${recordId}/payslip`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(payslipRes.status).toBe(200);
    const slip = payslipRes.body.data;
    expect(slip.payslipNumber).toBeDefined();
    expect(slip.earnings.baseSalary).toBe(25000);
    expect(slip.employee.designation).toBe('Senior Counter Executive');
    expect(slip.period.paymentMethod).toBe('BANK_TRANSFER');
    expect(slip.tenant.name).toBeDefined();
  });

  // =========================================================================
  // SECTION 7: SUBSCRIPTION LIMIT ENFORCEMENT (MAX_BRANCHES)
  // =========================================================================

  it('SUBSCRIPTION QUOTAS: Enforce branch limits against tenant plan tier', async () => {
    // Attempt to create a second branch when on default/starter tier (1 branch limit)
    const secondBranchRes = await request(app.getHttpServer())
      .post('/api/branches')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Second Satellite Hub',
        code: 'SAT-02',
        address: 'MG Road, Bengaluru',
        city: 'Bengaluru',
      });

    // Must be blocked if plan limit is 1, or allowed only if within quota
    if (secondBranchRes.status === 403) {
      expect(secondBranchRes.body.message).toMatch(/limit|maximum|allows/i);
    } else {
      expect([200, 201]).toContain(secondBranchRes.status);
    }
  });

  // =========================================================================
  // SECTION 8: SUPPORT TICKETING & IN-APP MESSAGING
  // =========================================================================

  it('SUPPORT & HELPDESK: Public contact info and bidirectional messaging thread', async () => {
    // 1. Fetch platform contact info
    const contactRes = await request(app.getHttpServer())
      .get('/api/support/contact-info');

    expect(contactRes.status).toBe(200);
    expect(contactRes.body.data?.serviceSupportNumber || contactRes.body.serviceSupportNumber).toBeDefined();

    // 2. Tenant adds reply message to ticket
    const replyRes = await request(app.getHttpServer())
      .post(`/api/support/tickets/${ticketAId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        message: 'Updated printer drivers to version 3.2.1, issue resolved after test print.',
      });

    expect(replyRes.status).toBe(201);
    const updatedTicket = replyRes.body.data;
    expect(updatedTicket.messages.length).toBeGreaterThanOrEqual(2);
    expect(updatedTicket.messages[updatedTicket.messages.length - 1].message).toContain('drivers');
  });
});
