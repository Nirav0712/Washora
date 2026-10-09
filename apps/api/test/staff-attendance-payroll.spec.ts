import * as dotenv from 'dotenv';
dotenv.config();
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import {
  RoleType,
  EmploymentType,
  StaffStatus,
  AttendanceStatus,
  SalaryType,
  PayrollPeriodStatus,
  SalaryAdvanceStatus,
  LeaveStatus,
} from '@washora/shared';

describe('Phase 05 — Staff Management, Attendance, Shifts, Leave & Payroll Foundation Suite', () => {
  jest.setTimeout(120000);

  let mongod: MongoMemoryServer;
  let app: INestApplication;

  // Tenant A Credentials & IDs
  let tokenA: string;
  let tenantAId: string;
  let branchA1Id: string;
  let branchA2Id: string;
  let operatorTokenA: string;
  let operatorStaffAId: string;
  let operatorUserAId: string;
  let cashierTokenA: string;
  let cashierStaffAId: string;

  // Tenant B Credentials & IDs
  let tokenB: string;
  let tenantBId: string;
  let branchBId: string;
  let staffBId: string;

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
        name: 'Workforce Alpha Owner',
        email: `workforce.alpha.${timestamp}@washora.test`,
        password: 'Password@123',
        phone: '+919811100010',
        tenantName: `Staff Corp Alpha ${timestamp}`,
        businessType: 'LAUNDRY',
        branchName: 'Alpha Hub 1',
        branchCity: 'Ahmedabad',
      });

    tokenA = regARes.body.data?.accessToken;
    tenantAId = regARes.body.data?.tenant?.id || regARes.body.data?.tenant?._id;
    branchA1Id = regARes.body.data?.branches?.[0]?.id || regARes.body.data?.membership?.branchIds?.[0];

    // Create Second Branch in Tenant A (Branch A2)
    const branchA2Res = await request(app.getHttpServer())
      .post('/api/branches')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Alpha Hub 2 Gandhinagar',
        code: `AH2-${timestamp.toString().slice(-4)}`,
        city: 'Gandhinagar',
        taxRate: 18,
        isActive: true,
      });
    branchA2Id = branchA2Res.body.data?.id || branchA2Res.body.data?._id;

    // Create Staff Operator in Tenant A
    const staffOpRes = await request(app.getHttpServer())
      .post('/api/staff')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Rahul Operator',
        email: `rahul.op.${timestamp}@washora.test`,
        password: 'Washora@2026',
        phone: '+919811100011',
        roleCode: RoleType.OPERATOR,
        designation: 'Senior Washer',
        department: 'Washing Department',
        employmentType: EmploymentType.FULL_TIME,
        primaryBranchId: branchA1Id,
        salaryConfiguration: {
          salaryType: SalaryType.MONTHLY,
          baseSalary: 3000000, // ₹30,000 in paise
          hourlyRate: 15000,
          overtimeRate: 25000,
          allowances: [{ name: 'HRA', amount: 200000 }], // ₹2,000 in paise
          deductions: [{ name: 'Tax/TDS', amount: 100000 }], // ₹1,000 in paise
        },
      });
    operatorStaffAId = staffOpRes.body.data?.id || staffOpRes.body.data?._id;
    operatorUserAId = staffOpRes.body.data?.userId?.id || staffOpRes.body.data?.userId?._id || staffOpRes.body.data?.userId;

    // Login as Operator A
    const loginOpRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: `rahul.op.${timestamp}@washora.test`,
        password: 'Washora@2026',
      });
    operatorTokenA = loginOpRes.body.data?.accessToken;

    // Create Cashier in Tenant A (no payroll/staff management permissions)
    const staffCashierRes = await request(app.getHttpServer())
      .post('/api/staff')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Sneha Cashier',
        email: `sneha.cashier.${timestamp}@washora.test`,
        password: 'Washora@2026',
        phone: '+919811100012',
        roleCode: RoleType.CASHIER,
        designation: 'Front Desk Cashier',
        department: 'Sales',
        employmentType: EmploymentType.FULL_TIME,
        primaryBranchId: branchA1Id,
      });
    cashierStaffAId = staffCashierRes.body.data?.id || staffCashierRes.body.data?._id;

    // Login as Cashier A
    const loginCashierRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: `sneha.cashier.${timestamp}@washora.test`,
        password: 'Washora@2026',
      });
    cashierTokenA = loginCashierRes.body.data?.accessToken;

    // 2. Register Tenant B Owner
    const regBRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Beta Workforce Owner',
        email: `workforce.beta.${timestamp}@washora.test`,
        password: 'Password@123',
        phone: '+919822200020',
        tenantName: `Staff Corp Beta ${timestamp}`,
        businessType: 'LAUNDRY',
        branchName: 'Beta Main Hub',
        branchCity: 'Pune',
      });

    tokenB = regBRes.body.data?.accessToken;
    tenantBId = regBRes.body.data?.tenant?.id || regBRes.body.data?.tenant?._id;
    branchBId = regBRes.body.data?.branches?.[0]?.id || regBRes.body.data?.membership?.branchIds?.[0];

    // Create Staff in Tenant B
    const staffBRes = await request(app.getHttpServer())
      .post('/api/staff')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Amit Beta Operator',
        email: `amit.beta.${timestamp}@washora.test`,
        password: 'Washora@2026',
        phone: '+919822200021',
        roleCode: RoleType.OPERATOR,
        designation: 'Ironer',
        primaryBranchId: branchBId,
      });
    staffBId = staffBRes.body.data?.id || staffBRes.body.data?._id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // =========================================================================
  // 1. STAFF MANAGEMENT & ISOLATION
  // =========================================================================
  describe('1. Staff Management & Tenant Isolation', () => {
    it('1. Tenant A cannot access Tenant B staff profile', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/staff/${staffBId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
    });

    it('2. Employee code is auto-generated with unique EMP- format and sequence', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/staff/${operatorStaffAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const data = res.body.data || res.body;
      expect(data.employeeCode).toMatch(/^EMP-\d{6}$/);
    });

    it('3. Duplicate user attachment to another staff profile in same tenant is rejected', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/staff')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          userId: operatorUserAId,
          primaryBranchId: branchA1Id,
          employmentType: EmploymentType.FULL_TIME,
        });

      expect(res.status).toBe(409);
    });

    it('4. Unauthorized user (Cashier without staff.update) cannot modify staff profile', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/staff/${operatorStaffAId}`)
        .set('Authorization', `Bearer ${cashierTokenA}`)
        .send({
          designation: 'Hacked Designation',
        });

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // 2. ATTENDANCE WORKFLOW & BRANCH ISOLATION
  // =========================================================================
  describe('2. Attendance Workflow, Check-in/out & Branch Rules', () => {
    let todayAttendanceId: string;

    it('5. Staff Operator can check in to assigned branch', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${operatorTokenA}`)
        .send({
          branchId: branchA1Id,
          notes: 'Morning shift check-in',
        });

      expect(res.status).toBe(201);
      const data = res.body.data || res.body;
      expect(data.checkInAt).toBeDefined();
      expect(data.status).toBe(AttendanceStatus.PRESENT);
      todayAttendanceId = data.id || data._id;
    });

    it('6. Duplicate check-in on the same date is rejected with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${operatorTokenA}`)
        .send({
          branchId: branchA1Id,
        });

      expect(res.status).toBe(409);
    });

    it('7. Staff Operator can check out and server calculates work minutes', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/attendance/check-out')
        .set('Authorization', `Bearer ${operatorTokenA}`)
        .send({
          notes: 'Finished daily shift',
        });

      expect(res.status).toBe(201);
      const data = res.body.data || res.body;
      expect(data.checkOutAt).toBeDefined();
      expect(data.workMinutes).toBeGreaterThanOrEqual(0);
    });

    it('8. Manager can correct attendance and compute work/overtime minutes', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/attendance/${todayAttendanceId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          workMinutes: 540, // 9 hours
          overtimeMinutes: 60, // 1 hour overtime
          correctionReason: 'Approved extra shift hour for rush processing',
          status: AttendanceStatus.PRESENT,
        });

      expect(res.status).toBe(200);
      const data = res.body.data || res.body;
      expect(data.workMinutes).toBe(540);
      expect(data.overtimeMinutes).toBe(60);
      expect(data.correctionReason).toBe('Approved extra shift hour for rush processing');
    });

    it('9. Unauthorized user cannot correct attendance', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/attendance/${todayAttendanceId}`)
        .set('Authorization', `Bearer ${cashierTokenA}`)
        .send({
          workMinutes: 600,
          correctionReason: 'Unauthorized change',
        });

      expect(res.status).toBe(403);
    });

    it('10. Tenant A cannot access Tenant B attendance records', async () => {
      // First check in Tenant B staff
      const loginBStaffRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: `amit.beta.${Date.now().toString().slice(0, 5)}@washora.test`,
          password: 'Washora@2026',
        });

      const res = await request(app.getHttpServer())
        .get(`/api/attendance/${todayAttendanceId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
    });

    it('11. Check-in to a branch without assignment is rejected', async () => {
      // Operator A only has access to Branch A1, not Branch A2
      const res = await request(app.getHttpServer())
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${operatorTokenA}`)
        .send({
          branchId: branchA2Id,
        });

      expect([400, 403]).toContain(res.status);
    });
  });

  // =========================================================================
  // 3. SHIFTS & SHIFT ASSIGNMENTS
  // =========================================================================
  describe('3. Shifts & Schedule Management', () => {
    let shiftId: string;
    let assignmentId: string;

    it('12. Authorized manager can create shift definition', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/shifts')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Morning Plant Shift',
          code: 'MORNING_PLANT',
          startTime: '08:00',
          endTime: '17:00',
          breakMinutes: 60,
          graceMinutes: 15,
          workingMinutes: 480,
        });

      expect(res.status).toBe(201);
      const data = res.body.data || res.body;
      expect(data.code).toBe('MORNING_PLANT');
      shiftId = data.id || data._id;
    });

    it('13. Staff can be assigned to valid branch shift', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/shifts/assignments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          staffId: operatorStaffAId,
          shiftId,
          date: '2026-10-15',
        });

      expect(res.status).toBe(201);
      const data = res.body.data || res.body;
      expect(data.date).toBe('2026-10-15');
      assignmentId = data.id || data._id;
    });

    it('14. Cross-tenant shift assignment is rejected', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/shifts/assignments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          staffId: staffBId, // Staff from Tenant B
          shiftId,
          date: '2026-10-15',
        });

      expect([400, 404]).toContain(res.status);
    });

    it('15. Manager can list and delete shift assignments', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/shifts/assignments')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(listRes.status).toBe(200);

      const delRes = await request(app.getHttpServer())
        .delete(`/api/shifts/assignments/${assignmentId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(delRes.status).toBe(200);
    });
  });

  // =========================================================================
  // 4. LEAVE REQUESTS & APPROVAL WORKFLOW
  // =========================================================================
  describe('4. Leave Types, Requests & Approvals', () => {
    let leaveTypeId: string;
    let leaveRequestId: string;

    it('16. Tenant leave types are seeded and queryable', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/leave/types')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const data = res.body.data || res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      leaveTypeId = data[0].id || data[0]._id;
    });

    it('17. Staff can submit a leave request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/leave/requests')
        .set('Authorization', `Bearer ${operatorTokenA}`)
        .send({
          branchId: branchA1Id,
          staffId: operatorStaffAId,
          leaveTypeId,
          startDate: '2026-10-20',
          endDate: '2026-10-21',
          totalDays: 2,
          reason: 'Family visit in home town',
        });

      expect(res.status).toBe(201);
      const data = res.body.data || res.body;
      expect(data.status).toBe(LeaveStatus.PENDING);
      expect(data.totalDays).toBe(2);
      leaveRequestId = data.id || data._id;
    });

    it('18. Overlapping leave request is rejected with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/leave/requests')
        .set('Authorization', `Bearer ${operatorTokenA}`)
        .send({
          branchId: branchA1Id,
          staffId: operatorStaffAId,
          leaveTypeId,
          startDate: '2026-10-21',
          endDate: '2026-10-22',
          totalDays: 2,
          reason: 'Overlapping leave',
        });

      expect(res.status).toBe(409);
    });

    it('19. Unauthorized user cannot approve leave', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/leave/requests/${leaveRequestId}/approve`)
        .set('Authorization', `Bearer ${cashierTokenA}`);

      expect(res.status).toBe(403);
    });

    it('20. Authorized manager can approve leave', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/leave/requests/${leaveRequestId}/approve`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const data = res.body.data || res.body;
      expect(data.status).toBe(LeaveStatus.APPROVED);
    });

    it('21. Leave rejection requires a non-empty reason', async () => {
      // Create second leave request to test rejection
      const reqRes = await request(app.getHttpServer())
        .post('/api/leave/requests')
        .set('Authorization', `Bearer ${operatorTokenA}`)
        .send({
          branchId: branchA1Id,
          staffId: operatorStaffAId,
          leaveTypeId,
          startDate: '2026-10-25',
          endDate: '2026-10-25',
          totalDays: 1,
          reason: 'Single day leave',
        });
      const req2Id = reqRes.body.data?.id || reqRes.body.data?._id;

      const rejectRes = await request(app.getHttpServer())
        .patch(`/api/leave/requests/${req2Id}/reject`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          rejectionReason: '',
        });

      expect(rejectRes.status).toBe(400);

      // Successful rejection with valid reason
      const validRejectRes = await request(app.getHttpServer())
        .patch(`/api/leave/requests/${req2Id}/reject`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          rejectionReason: 'Plant operation rush during festival season',
        });

      expect(validRejectRes.status).toBe(200);
      expect(validRejectRes.body.data?.status).toBe(LeaveStatus.REJECTED);
    });
  });

  // =========================================================================
  // 5. SALARY RECORDS & VERSIONING
  // =========================================================================
  describe('5. Salary Configuration & History Preservation', () => {
    it('22. Sensitive salary records are protected from users without payroll.view', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/staff/${operatorStaffAId}/salary`)
        .set('Authorization', `Bearer ${cashierTokenA}`);

      expect(res.status).toBe(403);
    });

    it('23. Updating salary creates a new version and preserves previous historical records', async () => {
      // Add new revised salary record
      const updateSalaryRes = await request(app.getHttpServer())
        .post(`/api/staff/${operatorStaffAId}/salary`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          salaryType: SalaryType.MONTHLY,
          baseSalary: 3500000, // Revised to ₹35,000
          hourlyRate: 18000,
          overtimeRate: 30000,
          allowances: [{ name: 'HRA', amount: 300000 }],
          deductions: [{ name: 'Tax', amount: 150000 }],
          effectiveFrom: '2026-11-01',
        });

      expect(updateSalaryRes.status).toBe(201);

      // Verify history list has both the old (₹30,000) and new (₹35,000) records
      const historyRes = await request(app.getHttpServer())
        .get(`/api/staff/${operatorStaffAId}/salary`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(historyRes.status).toBe(200);
      const data = historyRes.body.data || historyRes.body;
      expect(data.length).toBeGreaterThanOrEqual(2);
      expect(data[0].baseSalary).toBe(3500000);
      expect(data[0].isCurrent).toBe(true);
      expect(data[1].baseSalary).toBe(3000000);
      expect(data[1].isCurrent).toBe(false);
    });
  });

  // =========================================================================
  // 6. DETERMINISTIC PAYROLL CALCULATION & ADVANCES
  // =========================================================================
  describe('6. Deterministic Payroll Calculation & Salary Advances', () => {
    let payrollPeriodId: string;
    let advanceId: string;

    it('24. Authorized user can create a payroll period', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/payroll/periods')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'October 2026 Processing Payroll',
          startDate: '2026-10-01',
          endDate: '2026-10-31',
        });

      expect(res.status).toBe(201);
      const data = res.body.data || res.body;
      expect(data.status).toBe(PayrollPeriodStatus.DRAFT);
      payrollPeriodId = data.id || data._id;
    });

    it('25. Staff can request salary advance and manager can approve it', async () => {
      const advRes = await request(app.getHttpServer())
        .post('/api/payroll/advances')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          staffId: operatorStaffAId,
          amount: 250000, // ₹2,500 advance in paise
          reason: 'Festival emergency purchase',
        });

      expect(advRes.status).toBe(201);
      advanceId = advRes.body.data?.id || advRes.body.data?._id;

      // Approve advance for the October period
      const appAdvRes = await request(app.getHttpServer())
        .patch(`/api/payroll/advances/${advanceId}/approve`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          deductFromPayrollPeriodId: payrollPeriodId,
        });

      expect(appAdvRes.status).toBe(200);
      expect(appAdvRes.body.data?.status).toBe(SalaryAdvanceStatus.APPROVED);
    });

    it('26. Processing payroll calculates deterministic formula: Base + Allowances + Overtime - Deductions - Advance = Net', async () => {
      const processRes = await request(app.getHttpServer())
        .post(`/api/payroll/periods/${payrollPeriodId}/process`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(processRes.status).toBe(201);
      const periodData = processRes.body.data || processRes.body;
      expect(periodData.status).toBe(PayrollPeriodStatus.PROCESSED);

      // Query generated snapshot records for this period
      const recordsRes = await request(app.getHttpServer())
        .get(`/api/payroll/periods/${payrollPeriodId}/records`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(recordsRes.status).toBe(200);
      const records = recordsRes.body.data || recordsRes.body;
      const opRecord = records.find(
        (r: any) => (r.staffId?.id || r.staffId?._id || r.staffId) === operatorStaffAId,
      );

      expect(opRecord).toBeDefined();

      /**
       * Expected deterministic values:
       * Base Salary:     ₹35,000 (3,500,000 paise)
       * Total Allowances: ₹3,000 (300,000 paise)
       * Overtime Amount:  1 hour * ₹300 = ₹300 (30,000 paise) from attendance
       * Gross Salary:    3500000 + 300000 + 30000 = 3,830,000 paise (₹38,300)
       * Total Deductions: ₹1,500 (150,000 paise)
       * Advance Amount:   ₹2,500 (250,000 paise)
       * Net Salary:      3830000 - 150000 - 250000 = 3,430,000 paise (₹34,300)
       */
      expect(opRecord.grossSalary).toBe(opRecord.baseSalary + opRecord.totalAllowances + opRecord.overtimeAmount);
      expect(opRecord.netSalary).toBe(opRecord.grossSalary - opRecord.totalDeductions - opRecord.advanceAmount);
      expect(opRecord.advanceAmount).toBe(250000);
    });

    it('27. Manager can approve and lock payroll period', async () => {
      const approveRes = await request(app.getHttpServer())
        .post(`/api/payroll/periods/${payrollPeriodId}/approve`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(approveRes.status).toBe(201);
      expect(approveRes.body.data?.status).toBe(PayrollPeriodStatus.APPROVED);
    });

    it('28. Approved payroll period cannot be silently recalculated', async () => {
      const reprocessRes = await request(app.getHttpServer())
        .post(`/api/payroll/periods/${payrollPeriodId}/process`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(reprocessRes.status).toBe(400);
    });
  });

  // =========================================================================
  // 7. OPERATIONAL WORK SUMMARY & INTEGRATION
  // =========================================================================
  describe('7. Staff Operational Work Summary Integration', () => {
    it('29. Work summary aggregates attendance days, hours, overtime and processing jobs assigned/completed', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/staff/${operatorStaffAId}/work-summary`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const data = res.body.data || res.body;
      expect(data.staffId).toBe(operatorStaffAId);
      expect(data.employeeCode).toBeDefined();
      expect(data.presentDays).toBeGreaterThanOrEqual(1);
      expect(data.totalWorkHours).toBeGreaterThan(0);
      expect(data.overtimeHours).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 8. SECURITY, RBAC & ERROR HANDLING
  // =========================================================================
  describe('8. Security, Error Handling & Authentication', () => {
    it('30. Unauthenticated request to /api/staff returns 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/staff');
      expect(res.status).toBe(401);
    });

    it('31. Missing permission returns 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/payroll/periods')
        .set('Authorization', `Bearer ${cashierTokenA}`)
        .send({
          name: 'Unauthorized Period',
          startDate: '2026-11-01',
          endDate: '2026-11-30',
        });

      expect(res.status).toBe(403);
    });

    it('32. Invalid ObjectId returns safe 400 or 404 without crashing server', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/staff/invalid-object-id-123')
        .set('Authorization', `Bearer ${tokenA}`);

      expect([400, 404]).toContain(res.status);
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (mongod) {
      await mongod.stop();
    }
  });
});
