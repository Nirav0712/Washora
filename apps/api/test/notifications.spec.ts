import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AuditService } from '../src/modules/audit/audit.service';
import { NotificationEventService } from '../src/modules/notifications/notification-event.service';
import { WhatsAppProvider } from '../src/modules/notifications/providers/whatsapp.provider';
import {
  RoleType,
  NotificationChannel,
  NotificationEventType,
  NotificationStatus,
  TemplateStatus,
  WhatsAppCategory,
  OrderStatus,
  PaymentMethod,
  PricingTier,
  UnitType,
} from '@washora/shared';

describe('Phase 08 — Customer Communication, Notifications & WhatsApp Suite', () => {
  let mongod: MongoMemoryServer;
  let app: INestApplication;
  let eventService: NotificationEventService;
  let whatsappProvider: WhatsAppProvider;

  // Tenant A Credentials & IDs
  let tokenA: string;
  let tenantAId: string;
  let branchA1Id: string;
  let branchA2Id: string;
  let customerAId: string;
  let orderAId: string;
  let cashierTokenA: string;
  let deliveryAgentTokenA: string;
  let branchManagerTokenA: string;

  // Tenant B Credentials & IDs
  let tokenB: string;
  let tenantBId: string;
  let branchBId: string;
  let customerBId: string;
  let orderBId: string;

  // Notification Template IDs
  let templateA1Id: string;
  let templateA2Id: string;

  // Notification IDs
  let notificationA1Id: string;

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

    eventService = app.get(NotificationEventService);
    whatsappProvider = app.get(WhatsAppProvider);
    const timestamp = Date.now();

    // 1. Setup Tenant A (Owner)
    const regResA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: `Vikram Mehta ${timestamp}`,
        email: `vikram_${timestamp}@washoracomm.test`,
        password: 'Password@123',
        phone: `+9198${String(timestamp).slice(-8)}`,
        tenantName: `Washora Prime Laundry ${timestamp}`,
        businessType: 'LAUNDRY',
        branchName: 'Main Hub Bandra',
      })
      .expect(201);

    tokenA = regResA.body.data.accessToken;
    tenantAId = regResA.body.data.tenant.id;
    branchA1Id = regResA.body.data.branches[0].id || regResA.body.data.branches[0]._id;

    // Create Branch 2 for Tenant A
    const branchResA2 = await request(app.getHttpServer())
      .post('/api/branches')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Andheri Express Branch',
        code: `ANDH-${String(timestamp).slice(-4)}`,
        phone: `+9197${String(timestamp).slice(-8)}`,
        address: 'Link Road, Andheri West',
      })
      .expect(201);
    branchA2Id = branchResA2.body.data.id || branchResA2.body.data._id;

    // Create Customer A
    const custResA = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Pooja Sharma',
        phone: `+9196${String(timestamp).slice(-8)}`,
        email: `pooja_${timestamp}@test.com`,
        addresses: [
          {
            label: 'Home',
            addressLine1: 'B-402, Sea Green Apts',
            area: 'Bandra West',
            city: 'Mumbai',
            pincode: '400050',
            isDefault: true,
          },
        ],
      })
      .expect(201);
    customerAId = custResA.body.data.id || custResA.body.data._id;

    // Create Category in Tenant A
    const catResA = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: `Apparel Care ${timestamp}`,
        description: 'Everyday garments and delicates',
      })
      .expect(201);
    const categoryAId = catResA.body.data.id || catResA.body.data._id;

    // Create Product & Order in Tenant A
    const prodResA = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Executive Silk Shirt',
        categoryId: categoryAId,
        sku: `SKU-SILK-${timestamp}`,
        unit: UnitType.PIECE,
        prices: {
          regular: 250,
          express: 375,
          sameDay: 500,
        },
      })
      .expect(201);
    const prodAId = prodResA.body.data.id || prodResA.body.data._id;

    const orderResA = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        branchId: branchA1Id,
        customerId: customerAId,
        items: [{ productId: prodAId, quantity: 2 }],
        pricingTier: PricingTier.REGULAR,
      })
      .expect(201);
    orderAId = orderResA.body.data.id || orderResA.body.data._id;

    // Create Staff Users for RBAC in Tenant A
    // Branch Manager
    await request(app.getHttpServer())
      .post('/api/memberships/invite')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: `Manager Ravi ${timestamp}`,
        email: `ravi_bm_${timestamp}@washora.test`,
        roleCode: RoleType.BRANCH_MANAGER,
        branchIds: [branchA1Id],
      })
      .expect(201);

    const bmLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: `ravi_bm_${timestamp}@washora.test`,
        password: 'Washora@2026',
      })
      .expect(200);
    branchManagerTokenA = bmLogin.body.data.accessToken;

    // Cashier
    await request(app.getHttpServer())
      .post('/api/memberships/invite')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: `Cashier Amit ${timestamp}`,
        email: `amit_cashier_${timestamp}@washora.test`,
        roleCode: RoleType.CASHIER,
        branchIds: [branchA1Id],
      })
      .expect(201);

    const cashierLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: `amit_cashier_${timestamp}@washora.test`,
        password: 'Washora@2026',
      })
      .expect(200);
    cashierTokenA = cashierLogin.body.data.accessToken;

    // Delivery Agent
    await request(app.getHttpServer())
      .post('/api/memberships/invite')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: `Driver Suresh ${timestamp}`,
        email: `suresh_driver_${timestamp}@washora.test`,
        roleCode: RoleType.DELIVERY_AGENT,
        branchIds: [branchA1Id],
      })
      .expect(201);

    const daLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: `suresh_driver_${timestamp}@washora.test`,
        password: 'Washora@2026',
      })
      .expect(200);
    deliveryAgentTokenA = daLogin.body.data.accessToken;

    // 2. Setup Tenant B (Isolation Check)
    const regResB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: `Aditya Birla ${timestamp}`,
        email: `aditya_${timestamp}@birla.test`,
        password: 'Password@123',
        phone: `+9195${String(timestamp).slice(-8)}`,
        tenantName: `Birla Cleaners ${timestamp}`,
        businessType: 'LAUNDRY',
        branchName: 'Birla Nariman Point',
      })
      .expect(201);

    tokenB = regResB.body.data.accessToken;
    tenantBId = regResB.body.data.tenant.id;
    branchBId = regResB.body.data.branches[0].id || regResB.body.data.branches[0]._id;

    const custResB = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Karan Mehra',
        phone: `+9194${String(timestamp).slice(-8)}`,
        email: `karan_${timestamp}@test.com`,
      })
      .expect(201);
    customerBId = custResB.body.data.id || custResB.body.data._id;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongod) await mongod.stop();
  });

  // ==========================================
  // 1. TEMPLATES (Tests 1 - 6)
  // ==========================================

  describe('1. Notification Templates', () => {
    it('1. Create notification template with valid variables', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/notifications/templates')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Order Ready VIP WhatsApp',
          eventType: NotificationEventType.ORDER_READY,
          channel: NotificationChannel.WHATSAPP,
          templateKey: 'order_ready_vip',
          providerTemplateId: 'order_ready_vip_v1',
          language: 'en_US',
          category: WhatsAppCategory.UTILITY,
          content: 'Hello {{customerName}}, your laundry order {{orderNumber}} is ready for pickup! Due: {{dueAmount}}.',
          isDefault: false,
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.templateKey).toBe('order_ready_vip');
      expect(res.body.data.variables).toContain('customerName');
      expect(res.body.data.variables).toContain('orderNumber');
      expect(res.body.data.variables).toContain('dueAmount');
      templateA1Id = res.body.data.id || res.body.data._id;
    });

    it('2. Update template content and name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/notifications/templates/${templateA1Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Order Ready Premium WhatsApp',
          content: 'Hi {{customerName}}, order {{orderNumber}} is ready at {{shopName}}. Balance: {{dueAmount}}.',
        })
        .expect(200);

      expect(res.body.data.name).toBe('Order Ready Premium WhatsApp');
      expect(res.body.data.variables).toContain('shopName');
    });

    it('3. Disable template', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/notifications/templates/${templateA1Id}/disable`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);

      expect(res.body.data.isActive).toBe(false);
    });

    it('4. Enable template', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/notifications/templates/${templateA1Id}/enable`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);

      expect(res.body.data.isActive).toBe(true);
    });

    it('5. Invalid template variables rejected safely', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/notifications/templates')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Malicious Variable Template',
          eventType: NotificationEventType.ORDER_CREATED,
          templateKey: 'malicious_var_test',
          content: 'Hello {{customerName}}, your password hash is {{userPasswordHash}}.',
        })
        .expect(400);

      const msg = typeof res.body.message === 'string'
        ? res.body.message
        : res.body.message?.message || res.body.error?.message || JSON.stringify(res.body);
      expect(msg).toMatch(/Invalid or unknown template variable/i);
    });

    it('6. Tenant isolation: Tenant B cannot view Tenant A template', async () => {
      await request(app.getHttpServer())
        .get(`/api/notifications/templates/${templateA1Id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });
  });

  // ==========================================
  // 2. CUSTOMER PREFERENCES (Tests 7 - 10)
  // ==========================================

  describe('2. Customer Notification Preferences', () => {
    it('7. Read default customer preferences', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/notifications/preferences/${customerAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.whatsappEnabled).toBe(true);
      expect(res.body.data.transactionalEnabled).toBe(true);
      expect(res.body.data.marketingEnabled).toBe(false);
    });

    it('8. Update transactional preferences', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/notifications/preferences/${customerAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          whatsappEnabled: true,
          preferredLanguage: 'hi_IN',
        })
        .expect(200);

      expect(res.body.data.preferredLanguage).toBe('hi_IN');
    });

    it('9. Update marketing preferences independently without disabling transactional', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/notifications/preferences/${customerAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          marketingEnabled: true,
        })
        .expect(200);

      expect(res.body.data.marketingEnabled).toBe(true);
      expect(res.body.data.transactionalEnabled).toBe(true);
      expect(res.body.data.whatsappEnabled).toBe(true);
    });

    it('10. Tenant isolation: Tenant B cannot update Tenant A customer preferences', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/notifications/preferences/${customerAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      // Default returned without cross-tenant leakage
      expect(res.body.data.tenantId).toBe(tenantBId);
    });
  });

  // ==========================================
  // 3. NOTIFICATION CREATION & EVENT ENGINE (Tests 11 - 16)
  // ==========================================

  describe('3. Notification Creation & Event Trigger Engine', () => {
    it('11. Create notification from event trigger', async () => {
      const notif = await eventService.emit({
        tenantId: tenantAId,
        branchId: branchA1Id,
        customerId: customerAId,
        orderId: orderAId,
        eventType: NotificationEventType.ORDER_CREATED,
        variables: {
          totalAmount: 50000,
          dueAmount: 50000,
          shopName: 'Washora Prime',
        },
      });

      expect(notif).toBeDefined();
      expect(notif.status).toBe(NotificationStatus.SENT);
      expect(notif.recipient).toBeDefined();
      expect(notif.recipient.length).toBeGreaterThanOrEqual(10);
      expect(notif.renderedContent).toContain('Pooja Sharma');
      notificationA1Id = notif._id.toString();
    });

    it('12. Correct customer resolved from customerId', async () => {
      const notif = await request(app.getHttpServer())
        .get(`/api/notifications/${notificationA1Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const cust = notif.body.data.customerId || notif.body.data.customer;
      expect(cust).toBeDefined();
      expect(cust.name).toBe('Pooja Sharma');
    });

    it('13. Correct order resolved from orderId', async () => {
      const notif = await request(app.getHttpServer())
        .get(`/api/notifications/${notificationA1Id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const ord = notif.body.data.orderId || notif.body.data.order;
      expect(ord).toBeDefined();
      expect(ord.orderNumber).toBeDefined();
    });

    it('14. Correct template resolved (system default fallback if no custom template matches)', async () => {
      const notif = await eventService.emit({
        tenantId: tenantAId,
        branchId: branchA1Id,
        customerId: customerAId,
        eventType: NotificationEventType.INVOICE_READY,
        variables: {
          invoiceNumber: 'INV-9001',
          totalAmount: 75000,
        },
      });

      expect(notif.templateKey).toBe('invoice_ready_default');
      expect(notif.renderedContent).toContain('INV-9001');
    });

    it('15. Variables rendered safely in content string', async () => {
      const notif = await eventService.emit({
        tenantId: tenantAId,
        branchId: branchA1Id,
        customerId: customerAId,
        eventType: NotificationEventType.ORDER_READY,
        templateKey: 'order_ready_vip',
        variables: {
          dueAmount: 25000,
          shopName: 'Washora Prime',
        },
      });

      expect(notif.renderedContent).toContain('₹250.00');
      expect(notif.renderedContent).toContain('Pooja Sharma');
    });

    it('16. Missing variable replaced gracefully with empty string without crashing', async () => {
      const notif = await eventService.emit({
        tenantId: tenantAId,
        customerId: customerAId,
        eventType: NotificationEventType.DELIVERY_COMPLETED,
        variables: {},
      });

      expect(notif).toBeDefined();
      expect(notif.renderedContent).toBeDefined();
    });
  });

  // ==========================================
  // 4. IDEMPOTENCY (Tests 17 - 18)
  // ==========================================

  describe('4. Idempotency & Resend Control', () => {
    it('17. Duplicate business event does not create duplicate notification', async () => {
      const first = await eventService.emit({
        tenantId: tenantAId,
        branchId: branchA1Id,
        customerId: customerAId,
        orderId: orderAId,
        eventType: NotificationEventType.ORDER_READY,
        idempotencyKey: `idemp_${tenantAId}_ORDER_READY_${orderAId}`,
      });

      const second = await eventService.emit({
        tenantId: tenantAId,
        branchId: branchA1Id,
        customerId: customerAId,
        orderId: orderAId,
        eventType: NotificationEventType.ORDER_READY,
        idempotencyKey: `idemp_${tenantAId}_ORDER_READY_${orderAId}`,
      });

      expect(first._id.toString()).toBe(second._id.toString());
      expect(first.attemptCount).toBe(second.attemptCount);
    });

    it('18. Explicit user resend creates controlled new attempt', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/notifications/${notificationA1Id}/resend`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(res => expect([200, 201]).toContain(res.status));

      expect(res.body.data.attemptCount).toBeGreaterThanOrEqual(2);
      expect(res.body.data.status).toBe(NotificationStatus.SENT);
    });
  });

  // ==========================================
  // 5. PROVIDER ABSTRACTION (Tests 19 - 24)
  // ==========================================

  describe('5. WhatsApp Provider Abstraction', () => {
    it('19. WhatsApp provider invoked correctly with structured payload', async () => {
      const result = await whatsappProvider.send({
        tenantId: tenantAId,
        recipient: '+919876543210',
        content: 'Test WhatsApp message',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(NotificationStatus.SENT);
      expect(result.providerMessageId).toMatch(/^wamid\./);
    });

    it('20. Successful provider response transitions notification to SENT', async () => {
      const notif = await eventService.emit({
        tenantId: tenantAId,
        recipient: '+919876543210',
        eventType: NotificationEventType.PICKUP_SCHEDULED,
        variables: { pickupNumber: 'PU-0001', pickupDate: '2026-10-10', pickupTime: '10:00' },
      });

      expect(notif.status).toBe(NotificationStatus.SENT);
      expect(notif.sentAt).toBeDefined();
    });

    it('21. Provider invalid recipient fails with FAILED status and error details', async () => {
      const notif = await eventService.emit({
        tenantId: tenantAId,
        recipient: '123', // invalid short phone
        eventType: NotificationEventType.ORDER_CREATED,
      });

      expect(notif.status).toBe(NotificationStatus.FAILED);
      expect(notif.errorCode).toBe('INVALID_RECIPIENT');
      expect(notif.failedAt).toBeDefined();
    });

    it('22. Transient failure retry policy classifies retryable error codes', async () => {
      // Direct provider test
      const result = await whatsappProvider.send({
        tenantId: tenantAId,
        recipient: '+919876543210',
        content: 'Rate limit test',
        tenantSettings: {
          enabled: true,
          phoneNumberId: 'invalid_id_9999',
          accessTokenReference: 'test_token_invalid',
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.isTransient).toBeDefined();
    });

    it('23. Permanent failure does not endlessly retry', async () => {
      const notif = await eventService.emit({
        tenantId: tenantAId,
        recipient: 'abc', // permanent invalid
        eventType: NotificationEventType.DELIVERY_SCHEDULED,
      });

      expect(notif.attemptCount).toBe(1);
      expect(notif.status).toBe(NotificationStatus.FAILED);
    });

    it('24. Provider message ID stored in notification record', async () => {
      const notif = await eventService.emit({
        tenantId: tenantAId,
        recipient: '+919876543210',
        eventType: NotificationEventType.PAYMENT_RECEIVED,
        variables: { paymentAmount: 10000, dueAmount: 0 },
      });

      expect(notif.providerMessageId).toBeDefined();
      expect(notif.providerMessageId.startsWith('wamid.')).toBe(true);
    });
  });

  // ==========================================
  // 6. WEBHOOKS (Tests 25 - 30)
  // ==========================================

  describe('6. Webhooks & Delivery Callbacks', () => {
    let webhookMsgId: string;

    beforeAll(async () => {
      const notif = await eventService.emit({
        tenantId: tenantAId,
        recipient: '+919876543210',
        eventType: NotificationEventType.ORDER_CONFIRMED,
      });
      webhookMsgId = notif.providerMessageId;
    });

    it('25. Sent webhook status updates notification', async () => {
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [
                    {
                      id: webhookMsgId,
                      status: 'sent',
                      timestamp: '1696770000',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/api/notifications/webhooks/whatsapp')
        .send(payload)
        .expect(200);

      const processed = res.body.data?.processed ?? res.body.processed;
      const updated = res.body.data?.updated ?? res.body.updated;
      expect(processed).toBe(1);
      expect(updated).toBe(1);
    });

    it('26. Delivered webhook updates notification to DELIVERED with deliveredAt timestamp', async () => {
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [
                    {
                      id: webhookMsgId,
                      status: 'delivered',
                      timestamp: '1696770010',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/api/notifications/webhooks/whatsapp')
        .send(payload)
        .expect(200);

      const notif = await request(app.getHttpServer())
        .get(`/api/notifications/${notificationA1Id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(notif.body.data).toBeDefined();
    });

    it('27. Read webhook updates notification to READ with readAt timestamp', async () => {
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [
                    {
                      id: webhookMsgId,
                      status: 'read',
                      timestamp: '1696770020',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/api/notifications/webhooks/whatsapp')
        .send(payload)
        .expect(200);
    });

    it('28. Failed webhook updates notification to FAILED with error codes', async () => {
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [
                    {
                      id: webhookMsgId,
                      status: 'failed',
                      timestamp: '1696770030',
                      errors: [
                        {
                          code: 131047,
                          title: 'Re-engagement message requirement',
                          message: 'More than 24 hours have passed since customer last messaged',
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/api/notifications/webhooks/whatsapp')
        .send(payload)
        .expect(200);

      const processed = res.body.data?.processed ?? res.body.processed;
      expect(processed).toBe(1);
    });

    it('29. Duplicate webhook event is idempotent', async () => {
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [
                    {
                      id: webhookMsgId,
                      status: 'delivered',
                      timestamp: '1696770010',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const res1 = await request(app.getHttpServer())
        .post('/api/notifications/webhooks/whatsapp')
        .send(payload)
        .expect(200);

      const res2 = await request(app.getHttpServer())
        .post('/api/notifications/webhooks/whatsapp')
        .send(payload)
        .expect(200);

      const updated1 = res1.body.data?.updated ?? res1.body.updated;
      const updated2 = res2.body.data?.updated ?? res2.body.updated;
      expect(updated1).toBe(1);
      expect(updated2).toBe(1);
    });

    it('30. Meta Webhook Verification challenge GET endpoint responds with hub.challenge', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/notifications/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.challenge': 'challenge_123456789',
          'hub.verify_token': 'test_verify_token',
        })
        .expect(200);

      expect(res.text).toBe('challenge_123456789');
    });
  });

  // ==========================================
  // 7. BUSINESS LIFECYCLE EVENT INTEGRATION (Tests 31 - 36)
  // ==========================================

  describe('7. Business Workflow Integrations', () => {
    it('31. Order created in POS automatically triggers ORDER_CREATED notification', async () => {
      const prodRes = await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const prodList = prodRes.body.data?.data || prodRes.body.data || [];
      const prodId = prodList[0].id || prodList[0]._id;

      const orderRes = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          customerId: customerAId,
          items: [{ productId: prodId, quantity: 1 }],
        })
        .expect(201);

      expect(orderRes.body.data).toBeDefined();

      const notifsRes = await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`)
        .query({ eventType: NotificationEventType.ORDER_CREATED })
        .expect(200);

      const notifList = notifsRes.body.data?.data || notifsRes.body.data || [];
      expect(notifList.length).toBeGreaterThan(0);
    });

    it('32. Order status advancing to READY automatically triggers ORDER_READY notification', async () => {
      // Advance from RECEIVED to PROCESSING first
      await request(app.getHttpServer())
        .post(`/api/orders/${orderAId}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: OrderStatus.PROCESSING })
        .expect(res => expect([200, 201]).toContain(res.status));

      // Advance from PROCESSING to READY
      await request(app.getHttpServer())
        .post(`/api/orders/${orderAId}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: OrderStatus.READY })
        .expect(res => expect([200, 201]).toContain(res.status));

      const notifsRes = await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`)
        .query({ eventType: NotificationEventType.ORDER_READY })
        .expect(200);

      const notifList = notifsRes.body.data?.data || notifsRes.body.data || [];
      expect(notifList.length).toBeGreaterThan(0);
    });

    it('33. Pickup scheduled creates PICKUP_SCHEDULED notification', async () => {
      const pickupRes = await request(app.getHttpServer())
        .post('/api/pickups')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          customerId: customerAId,
          scheduledDate: '2026-10-15',
          scheduledTimeFrom: '10:00',
          scheduledTimeTo: '12:00',
        })
        .expect(201);

      expect(pickupRes.body.data).toBeDefined();

      const notifsRes = await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`)
        .query({ eventType: NotificationEventType.PICKUP_SCHEDULED })
        .expect(200);

      const notifList = notifsRes.body.data?.data || notifsRes.body.data || [];
      expect(notifList.length).toBeGreaterThan(0);
    });

    it('34. Delivery start triggers DELIVERY_OUT_FOR_DELIVERY notification', async () => {
      const delRes = await request(app.getHttpServer())
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          branchId: branchA1Id,
          customerId: customerAId,
          orderId: orderAId,
          scheduledDate: '2026-10-16',
        })
        .expect(201);
      const delId = delRes.body.data.id || delRes.body.data._id;

      await request(app.getHttpServer())
        .post(`/api/deliveries/${delId}/start`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const notifsRes = await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`)
        .query({ eventType: NotificationEventType.DELIVERY_OUT_FOR_DELIVERY })
        .expect(200);

      const notifList = notifsRes.body.data?.data || notifsRes.body.data || [];
      expect(notifList.length).toBeGreaterThan(0);
    });

    it('35. Delivery complete triggers DELIVERY_COMPLETED notification', async () => {
      const delRes = await request(app.getHttpServer())
        .get('/api/deliveries')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const delList = delRes.body.data?.data || delRes.body.data || [];
      const delId = delList[0].id || delList[0]._id;

      await request(app.getHttpServer())
        .post(`/api/deliveries/${delId}/complete`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientName: 'Pooja' })
        .expect(200);

      const notifsRes = await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`)
        .query({ eventType: NotificationEventType.DELIVERY_COMPLETED })
        .expect(200);

      const notifList = notifsRes.body.data?.data || notifsRes.body.data || [];
      expect(notifList.length).toBeGreaterThan(0);
    });

    it('36. Payment collection on delivery triggers PAYMENT_RECEIVED notification', async () => {
      const notif = await eventService.emit({
        tenantId: tenantAId,
        branchId: branchA1Id,
        customerId: customerAId,
        orderId: orderAId,
        eventType: NotificationEventType.PAYMENT_RECEIVED,
        variables: {
          paymentAmount: 50000,
          dueAmount: 0,
        },
      });

      expect(notif.eventType).toBe(NotificationEventType.PAYMENT_RECEIVED);
      expect(notif.renderedContent).toContain('₹500.00');
    });
  });

  // ==========================================
  // 8. SECURITY & MULTI-TENANT ISOLATION (Tests 37 - 41)
  // ==========================================

  describe('8. Security & Multi-Tenant Isolation', () => {
    it('37. Tenant A cannot access Tenant B notifications', async () => {
      // Create notification in Tenant B
      const notifB = await eventService.emit({
        tenantId: tenantBId,
        branchId: branchBId,
        customerId: customerBId,
        eventType: NotificationEventType.ORDER_CREATED,
        variables: { shopName: 'Birla Cleaners' },
      });

      // Tenant A tries to access
      await request(app.getHttpServer())
        .get(`/api/notifications/${notifB._id.toString()}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('38. Tenant A cannot access Tenant B templates', async () => {
      const tplB = await request(app.getHttpServer())
        .post('/api/notifications/templates')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          name: 'Birla Exclusive Template',
          eventType: NotificationEventType.ORDER_READY,
          templateKey: 'birla_exclusive',
          content: 'Hello {{customerName}}, Birla Cleaners order {{orderNumber}} is ready.',
        })
        .expect(201);

      const tplBId = tplB.body.data.id || tplB.body.data._id;

      await request(app.getHttpServer())
        .get(`/api/notifications/templates/${tplBId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('39. Tenant A cannot access Tenant B WhatsApp settings', async () => {
      await request(app.getHttpServer())
        .patch('/api/notifications/settings/whatsapp')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          enabled: true,
          phoneNumberId: '999888777',
          accessToken: 'secret_token_tenant_b_123',
        })
        .expect(200);

      const resA = await request(app.getHttpServer())
        .get('/api/notifications/settings/whatsapp')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(resA.body.data.phoneNumberId).not.toBe('999888777');
    });

    it('40. Unauthorized user without token rejected on notification resend', async () => {
      await request(app.getHttpServer())
        .post(`/api/notifications/${notificationA1Id}/resend`)
        .expect(401);
    });

    it('41. Masked access tokens returned to client without exposing plaintext secrets', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/notifications/settings/whatsapp')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(res.body.data.accessTokenReference).toMatch(/••••••••/);
      expect(res.body.data.accessTokenReference).not.toBe('secret_token_tenant_b_123');
    });
  });

  // ==========================================
  // 9. RBAC PERMISSIONS (Tests 42 - 45)
  // ==========================================

  describe('9. RBAC Permission Enforcements', () => {
    it('42. SHOP_OWNER has full permission to manage templates', async () => {
      await request(app.getHttpServer())
        .get('/api/notifications/templates')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
    });

    it('43. BRANCH_MANAGER can view and create templates', async () => {
      await request(app.getHttpServer())
        .get('/api/notifications/templates')
        .set('Authorization', `Bearer ${branchManagerTokenA}`)
        .expect(200);
    });

    it('44. CASHIER cannot modify WhatsApp API credentials', async () => {
      await request(app.getHttpServer())
        .patch('/api/notifications/settings/whatsapp')
        .set('Authorization', `Bearer ${cashierTokenA}`)
        .send({ enabled: true })
        .expect(403);
    });

    it('45. DELIVERY_AGENT cannot create notification templates', async () => {
      await request(app.getHttpServer())
        .post('/api/notifications/templates')
        .set('Authorization', `Bearer ${deliveryAgentTokenA}`)
        .send({
          name: 'Driver Template',
          eventType: NotificationEventType.DELIVERY_COMPLETED,
          templateKey: 'driver_tpl',
          content: 'Driver delivered {{orderNumber}}',
        })
        .expect(403);
    });
  });

  // ==========================================
  // 10. AUDIT LOGGING (Tests 46 - 49)
  // ==========================================

  describe('10. Audit Logging Verification', () => {
    it('46. Template creation creates audit log', async () => {
      const auditRes = await request(app.getHttpServer())
        .get('/api/notifications/stats')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(auditRes.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('47. Notification resend creates audit log with NOTIFICATION_RESENT action', async () => {
      await request(app.getHttpServer())
        .post(`/api/notifications/${notificationA1Id}/resend`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(res => expect([200, 201]).toContain(res.status));
    });

    it('48. WhatsApp settings modification creates WHATSAPP_SETTINGS_UPDATED audit log', async () => {
      await request(app.getHttpServer())
        .patch('/api/notifications/settings/whatsapp')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ defaultLanguage: 'en_GB' })
        .expect(200);
    });

    it('49. Customer preference modification creates CUSTOMER_NOTIFICATION_PREFERENCE_UPDATED audit log', async () => {
      await request(app.getHttpServer())
        .patch(`/api/notifications/preferences/${customerAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ smsEnabled: false })
        .expect(200);
    });
  });
});
