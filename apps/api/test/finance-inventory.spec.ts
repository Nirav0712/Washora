import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import {
  RoleType,
  ExpenseStatus,
  ExpensePaymentMethod,
  PurchaseStatus,
  PurchasePaymentStatus,
  InventoryUnit,
  StockMovementType,
  TransferStatus,
} from '@washora/shared';

describe('Phase 06 — Finance, Expenses, Inventory, Suppliers & Operational Reporting Suite', () => {
  let mongod: MongoMemoryServer;
  let app: INestApplication;

  // Tenant A Credentials & IDs
  let tokenA: string;
  let tenantAId: string;
  let branchA1Id: string;
  let branchA2Id: string;
  let cashierTokenA: string;

  // Tenant B Credentials & IDs
  let tokenB: string;
  let tenantBId: string;
  let branchBId: string;

  // Phase 06 Entities in Tenant A
  let expCatAId: string;
  let expenseAId: string;
  let supplierAId: string;
  let invCatAId: string;
  let invItemA1Id: string;
  let invItemA2Id: string;
  let purchaseAId: string;
  let transferAId: string;

  // Phase 06 Entities in Tenant B
  let expenseBId: string;
  let supplierBId: string;
  let invItemBId: string;
  let purchaseBId: string;

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

    // 1. Setup Tenant A with 2 branches
    const regResA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Vikram Mehta',
        email: 'vikram@washoraprime.test',
        password: 'Password@123',
        phone: '+919876500001',
        tenantName: 'Washora Prime Laundry',
        businessType: 'LAUNDRY',
        branchName: 'Indiranagar Prime Branch',
      })
      .expect(201);

    tokenA = regResA.body.data.accessToken;
    tenantAId = regResA.body.data.tenant.id;
    branchA1Id = regResA.body.data.branches[0].id || regResA.body.data.branches[0]._id;

    // Create second branch for Tenant A (for inventory transfer tests)
    const branchResA2 = await request(app.getHttpServer())
      .post('/api/branches')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Koramangala Hub Plant',
        code: 'KOR-01',
        phone: '+919988776655',
        address: '80ft Road, 4th Block, Koramangala',
      })
      .expect(201);
    branchA2Id = branchResA2.body.data._id || branchResA2.body.data.id;

    // 2. Setup Tenant B
    const regResB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Sanjay Kapoor',
        email: 'sanjay@elitedry.test',
        password: 'Password@123',
        phone: '+919876500002',
        tenantName: 'Elite Drycleaners',
        businessType: 'DRY_CLEANING',
        branchName: 'Whitefield Branch',
      })
      .expect(201);

    tokenB = regResB.body.data.accessToken;
    tenantBId = regResB.body.data.tenant.id;
    branchBId = regResB.body.data.branches[0].id || regResB.body.data.branches[0]._id;
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
    if (mongod) await mongod.stop();
  });

  // =========================================================================
  // 1. EXPENSES & EXPENSE CATEGORIES WORKFLOW
  // =========================================================================
  describe('1. Expenses & Expense Categories Workflow', () => {
    it('should list seeded default expense categories or allow creating custom category', async () => {
      const catRes = await request(app.getHttpServer())
        .post('/api/expenses/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Boiler Fuel & Diesel',
          code: 'BOILER_FUEL',
          description: 'Diesel fuel for steam boiler plant',
          color: '#F59E0B',
          icon: 'Flame',
        })
        .expect(201);

      expCatAId = catRes.body.data._id || catRes.body.data.id;
      expect(catRes.body.data.name).toBe('Boiler Fuel & Diesel');
      expect(catRes.body.data.code).toBe('BOILER_FUEL');

      const listRes = await request(app.getHttpServer())
        .get('/api/expenses/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(Array.isArray(listRes.body.data)).toBe(true);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should create an expense with atomic EXP-XXXXXX number in DRAFT / PENDING status', async () => {
      const expRes = await request(app.getHttpServer())
        .post('/api/expenses')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          categoryId: expCatAId,
          title: '50 Liters Diesel for Steam Boiler',
          description: 'Weekly boiler fuel refill',
          amount: 450000, // ₹4,500.00 in paise
          expenseDate: '2026-10-08',
          paymentMethod: ExpensePaymentMethod.CASH,
          notes: 'Purchased from Shell petrol pump',
        })
        .expect(201);

      expenseAId = expRes.body.data._id || expRes.body.data.id;
      expect(expRes.body.data.expenseNumber).toMatch(/^EXP-\d{6}$/);
      expect(expRes.body.data.amount).toBe(450000);
      expect([ExpenseStatus.DRAFT, ExpenseStatus.PENDING, ExpenseStatus.PENDING_APPROVAL]).toContain(
        expRes.body.data.status,
      );
    });

    it('should approve an expense', async () => {
      const approveRes = await request(app.getHttpServer())
        .post(`/api/expenses/${expenseAId}/approve`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);

      expect(approveRes.body.data.status).toBe(ExpenseStatus.APPROVED);
      expect(approveRes.body.data.approvedAt).toBeDefined();
    });

    it('should pay and settle an approved expense', async () => {
      const payRes = await request(app.getHttpServer())
        .post(`/api/expenses/${expenseAId}/pay`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          paymentMethod: ExpensePaymentMethod.UPI,
          referenceNumber: 'UPI-99882244',
        })
        .expect(201);

      expect(payRes.body.data.status).toBe(ExpenseStatus.PAID);
      expect(payRes.body.data.paidAt).toBeDefined();
    });
  });

  // =========================================================================
  // 2. SUPPLIER MANAGEMENT & SUPPLIER PAYMENTS
  // =========================================================================
  describe('2. Suppliers & Supplier Payments Workflow', () => {
    it('should create a supplier with atomic SUP-XXXXXX code and opening balance', async () => {
      const supRes = await request(app.getHttpServer())
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          businessName: 'Apex Clean Chemicals Pvt Ltd',
          contactPerson: 'Ramesh Sharma',
          phone: '+919876543210',
          email: 'sales@apexclean.com',
          gstNumber: '29ABCDE1234F1Z5',
          address: 'Plot 14, Industrial Estate, Peenya, Bangalore',
          categories: ['Detergents', 'Solvents'],
          openingBalance: 1500000, // ₹15,000.00 opening balance owed
        })
        .expect(201);

      supplierAId = supRes.body.data._id || supRes.body.data.id;
      expect(supRes.body.data.supplierCode).toMatch(/^SUP-\d{6}$/);
      expect(supRes.body.data.businessName).toBe('Apex Clean Chemicals Pvt Ltd');
      expect(supRes.body.data.currentBalance).toBe(1500000);
    });

    it('should retrieve supplier details and calculate ledger', async () => {
      const ledgerRes = await request(app.getHttpServer())
        .get(`/api/suppliers/${supplierAId}/ledger`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(ledgerRes.body.data.currentBalance).toBe(1500000);
      expect(ledgerRes.body.data.transactions.length).toBeGreaterThanOrEqual(1);
    });

    it('should record a supplier payment with atomic SPAY-XXXXXX and reduce current balance', async () => {
      const payRes = await request(app.getHttpServer())
        .post('/api/suppliers/payments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          supplierId: supplierAId,
          branchId: branchA1Id,
          amount: 500000, // ₹5,000.00 payment
          paymentMethod: ExpensePaymentMethod.BANK_TRANSFER,
          referenceNumber: 'NEFT-88392189',
          notes: 'Partial payment towards opening balance',
        })
        .expect(201);

      expect(payRes.body.data.paymentNumber).toMatch(/^SPAY-\d{6}$/);
      expect(payRes.body.data.amount).toBe(500000);

      // Verify supplier current balance was decremented: 1,500,000 - 500,000 = 1,000,000
      const getSup = await request(app.getHttpServer())
        .get(`/api/suppliers/${supplierAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(getSup.body.data.currentBalance).toBe(1000000);
    });
  });

  // =========================================================================
  // 3. INVENTORY, WEIGHTED AVERAGE COST & STOCK MOVEMENTS
  // =========================================================================
  describe('3. Inventory, Weighted Average Cost & Stock Movements', () => {
    it('should seed default inventory categories and create an item with initial stock', async () => {
      const catRes = await request(app.getHttpServer())
        .get('/api/inventory/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(catRes.body.data.length).toBeGreaterThan(0);
      invCatAId = catRes.body.data[0]._id || catRes.body.data[0].id;

      // Create item 1 with initial stock: 20 Liters @ ₹300.00/L (30,000 paise)
      const itemRes = await request(app.getHttpServer())
        .post('/api/inventory/items')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          categoryId: invCatAId,
          name: 'Eco Ultra Liquid Detergent',
          description: 'High-efficiency low-foam commercial laundry detergent',
          unit: InventoryUnit.LITER,
          initialStock: 20,
          minimumStock: 5,
          reorderLevel: 8,
          unitCost: 30000,
        })
        .expect(201);

      invItemA1Id = itemRes.body.data._id || itemRes.body.data.id;
      expect(itemRes.body.data.inventoryCode).toMatch(/^INV-\d{6}$/);
      expect(itemRes.body.data.currentStock).toBe(20);
      expect(itemRes.body.data.averageCost).toBe(30000);

      // Verify initial stock movement was automatically recorded
      const movRes = await request(app.getHttpServer())
        .get(`/api/inventory/movements?inventoryItemId=${invItemA1Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(movRes.body.data.data.length).toBe(1);
      expect(movRes.body.data.data[0].type).toBe(StockMovementType.INITIAL_STOCK);
      expect(movRes.body.data.data[0].afterQuantity).toBe(20);
    });

    it('should perform manual stock consumption and log movement', async () => {
      const adjustRes = await request(app.getHttpServer())
        .post('/api/inventory/adjustments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          inventoryItemId: invItemA1Id,
          type: StockMovementType.CONSUMPTION,
          quantity: -4, // used 4 Liters in washing load
          reason: 'Daily laundry plant consumption batch #1',
        })
        .expect(200);

      expect(adjustRes.body.data.item.currentStock).toBe(16);
      expect(adjustRes.body.data.movement.beforeQuantity).toBe(20);
      expect(adjustRes.body.data.movement.afterQuantity).toBe(16);
    });

    it('should calculate weighted-average cost when new stock is added at different price', async () => {
      // Existing stock: 16 Liters @ 30,000 paise = 480,000
      // Incoming stock: 10 Liters @ 40,000 paise = 400,000
      // Total Qty: 26 Liters, Total Val: 880,000 -> New Avg: 880,000 / 26 ≈ 33846 paise
      const addRes = await request(app.getHttpServer())
        .post('/api/inventory/adjustments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          inventoryItemId: invItemA1Id,
          type: StockMovementType.INITIAL_STOCK,
          quantity: 10,
          unitCost: 40000,
          reason: 'Extra stock added from local warehouse',
        })
        .expect(200);

      expect(addRes.body.data.item.currentStock).toBe(26);
      expect(addRes.body.data.item.averageCost).toBe(33846);
    });

    it('should return inventory valuation calculation', async () => {
      const valRes = await request(app.getHttpServer())
        .get('/api/inventory/valuation')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(valRes.body.data.totalValuation).toBeGreaterThan(0);
      expect(valRes.body.data.totalItemsCount).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 4. BRANCH INVENTORY TRANSFERS
  // =========================================================================
  describe('4. Branch Inventory Transfers Workflow', () => {
    it('should request and complete an inventory transfer from Branch 1 to Branch 2', async () => {
      // 1. Request transfer of 6 Liters from Branch A1 to Branch A2
      const reqTransRes = await request(app.getHttpServer())
        .post('/api/inventory/transfers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          fromBranchId: branchA1Id,
          toBranchId: branchA2Id,
          inventoryItemId: invItemA1Id,
          quantity: 6,
          notes: 'Emergency transfer for Koramangala plant',
        })
        .expect(201);

      transferAId = reqTransRes.body.data._id || reqTransRes.body.data.id;
      expect(reqTransRes.body.data.status).toBe(TransferStatus.PENDING);
      expect(reqTransRes.body.data.quantity).toBe(6);

      // 2. Complete transfer
      const compTransRes = await request(app.getHttpServer())
        .post(`/api/inventory/transfers/${transferAId}/complete`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ notes: 'Received and verified by plant supervisor' })
        .expect(201);

      expect(compTransRes.body.data.status).toBe(TransferStatus.COMPLETED);

      // 3. Verify Branch A1 stock was deducted: 26 - 6 = 20
      const sourceItem = await request(app.getHttpServer())
        .get(`/api/inventory/items/${invItemA1Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(sourceItem.body.data.currentStock).toBe(20);

      // 4. Verify Branch A2 has the item with stock 6
      const destItems = await request(app.getHttpServer())
        .get(`/api/inventory/items?branchId=${branchA2Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(destItems.body.data.data.length).toBe(1);
      expect(destItems.body.data.data[0].currentStock).toBe(6);
      expect(destItems.body.data.data[0].name).toBe('Eco Ultra Liquid Detergent');
    });
  });

  // =========================================================================
  // 5. PURCHASE ORDERS & AUTOMATIC INVENTORY INTAKE
  // =========================================================================
  describe('5. Purchase Orders & Stock Intake Workflow', () => {
    it('should create a Purchase Order with items and atomic PUR-XXXXXX number', async () => {
      const purRes = await request(app.getHttpServer())
        .post('/api/purchases')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          supplierId: supplierAId,
          items: [
            {
              inventoryItemId: invItemA1Id,
              quantity: 10,
              unitCost: 32000, // ₹320.00 / Liter
              taxRate: 18, // 18% GST
            },
          ],
          notes: 'PO for monthly chemical supplies',
          status: PurchaseStatus.ORDERED,
        })
        .expect(201);

      purchaseAId = purRes.body.data._id || purRes.body.data.id;
      expect(purRes.body.data.purchaseNumber).toMatch(/^PUR-\d{6}$/);
      expect(purRes.body.data.subtotal).toBe(320000); // 10 * 32,000 = 320,000
      expect(purRes.body.data.tax).toBe(57600); // 18% of 320,000 = 57,600
      expect(purRes.body.data.grandTotal).toBe(377600); // ₹3,776.00
      expect(purRes.body.data.status).toBe(PurchaseStatus.ORDERED);
      expect(purRes.body.data.paymentStatus).toBe(PurchasePaymentStatus.UNPAID);

      // Verify supplier current balance increased by PO total: 1,000,000 + 377,600 = 1,377,600
      const getSup = await request(app.getHttpServer())
        .get(`/api/suppliers/${supplierAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(getSup.body.data.currentBalance).toBe(1377600);
    });

    it('should receive purchase order goods and automatically increment inventory stock', async () => {
      // Stock before receipt: 20 Liters
      const recRes = await request(app.getHttpServer())
        .post(`/api/purchases/${purchaseAId}/receive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);

      expect(recRes.body.data.status).toBe(PurchaseStatus.RECEIVED);
      expect(recRes.body.data.receivedAt).toBeDefined();

      // Check stock after receipt: 20 + 10 = 30 Liters
      const checkItem = await request(app.getHttpServer())
        .get(`/api/inventory/items/${invItemA1Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(checkItem.body.data.currentStock).toBe(30);

      // Verify movement recorded as PURCHASE_RECEIPT
      const movRes = await request(app.getHttpServer())
        .get(`/api/inventory/movements?inventoryItemId=${invItemA1Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const receiptMovement = movRes.body.data.data.find(
        (m: any) => m.type === StockMovementType.PURCHASE_RECEIPT,
      );
      expect(receiptMovement).toBeDefined();
      expect(receiptMovement.quantity).toBe(10);
    });

    it('should pay against purchase order and update paymentStatus', async () => {
      const payRes = await request(app.getHttpServer())
        .post(`/api/purchases/${purchaseAId}/pay`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          amount: 377600, // Full payment
          paymentMethod: ExpensePaymentMethod.BANK_TRANSFER,
          referenceNumber: 'RTGS-11223344',
          notes: 'Full invoice settlement',
        })
        .expect(201);

      expect(payRes.body.data.paymentStatus).toBe(PurchasePaymentStatus.PAID);
      expect(payRes.body.data.dueAmount).toBe(0);
      expect(payRes.body.data.paidAmount).toBe(377600);

      // Verify supplier current balance reduced: 1,377,600 - 377,600 = 1,000,000
      const getSup = await request(app.getHttpServer())
        .get(`/api/suppliers/${supplierAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(getSup.body.data.currentBalance).toBe(1000000);
    });
  });

  // =========================================================================
  // 6. FINANCE DASHBOARD & FINANCIAL REPORTING
  // =========================================================================
  describe('6. Finance Dashboard & Financial Reporting', () => {
    it('should return operational dashboard with accurate financial metrics', async () => {
      const dashRes = await request(app.getHttpServer())
        .get('/api/finance/dashboard')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const summary = dashRes.body.data.summary;
      expect(summary).toBeDefined();
      expect(summary.totalExpenses).toBe(450000); // 1 approved/paid expense of ₹4,500.00
      expect(summary.totalPayables).toBe(1000000); // Supplier balance of ₹10,000.00
      expect(summary.inventoryValuation).toBeGreaterThan(0);
    });

    it('should return revenue, expense and profit-loss breakdown reports', async () => {
      const [revRes, expRes, pnlRes] = await Promise.all([
        request(app.getHttpServer())
          .get('/api/finance/reports/revenue')
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200),
        request(app.getHttpServer())
          .get('/api/finance/reports/expenses')
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200),
        request(app.getHttpServer())
          .get('/api/finance/reports/profit-loss')
          .set('Authorization', `Bearer ${tokenA}`)
          .expect(200),
      ]);

      expect(expRes.body.data.totalExpenses).toBe(450000);
      expect(Array.isArray(expRes.body.data.byCategory)).toBe(true);
      expect(pnlRes.body.data.summary).toBeDefined();
    });
  });

  // =========================================================================
  // 7. STRICT MULTI-TENANT ISOLATION ON ALL PHASE 06 MODULES
  // =========================================================================
  describe('7. Strict Multi-Tenant Security & Isolation Verification', () => {
    it('Tenant B cannot access or view Tenant A expenses', async () => {
      await request(app.getHttpServer())
        .get(`/api/expenses/${expenseAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);

      await request(app.getHttpServer())
        .post(`/api/expenses/${expenseAId}/approve`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('Tenant B cannot access or modify Tenant A suppliers', async () => {
      await request(app.getHttpServer())
        .get(`/api/suppliers/${supplierAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);

      await request(app.getHttpServer())
        .get(`/api/suppliers/${supplierAId}/ledger`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);

      await request(app.getHttpServer())
        .post('/api/suppliers/payments')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          supplierId: supplierAId,
          amount: 100000,
          paymentMethod: ExpensePaymentMethod.CASH,
        })
        .expect(404);
    });

    it('Tenant B cannot access Tenant A inventory items or stock movements', async () => {
      await request(app.getHttpServer())
        .get(`/api/inventory/items/${invItemA1Id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);

      await request(app.getHttpServer())
        .post('/api/inventory/adjustments')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          inventoryItemId: invItemA1Id,
          type: StockMovementType.CONSUMPTION,
          quantity: -1,
        })
        .expect(400); // Invalid item for Tenant B
    });

    it('Tenant B cannot access or receive Tenant A purchase orders', async () => {
      await request(app.getHttpServer())
        .get(`/api/purchases/${purchaseAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);

      await request(app.getHttpServer())
        .post(`/api/purchases/${purchaseAId}/receive`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });
  });
});
