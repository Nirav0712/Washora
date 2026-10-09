// ==========================================
// WASHORA SHARED DOMAIN TYPES & CONSTANTS
// Phase 03: Production POS, Customers, Orders, Garments, Payments
// ==========================================

export enum BusinessType {
  LAUNDRY = 'LAUNDRY',
  DRY_CLEANING = 'DRY_CLEANING',
  IRONING = 'IRONING',
  COMMERCIAL_LAUNDRY = 'COMMERCIAL_LAUNDRY',
  GARMENT_CARE = 'GARMENT_CARE',
  OTHER = 'OTHER'
}

export enum TenantStatus {
  PROVISIONING = 'PROVISIONING',
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED',
}

export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  INVITED = 'INVITED',
  SUSPENDED = 'SUSPENDED'
}

export enum RoleType {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SHOP_OWNER = 'SHOP_OWNER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  CASHIER = 'CASHIER',
  OPERATOR = 'OPERATOR',
  QC_INSPECTOR = 'QC_INSPECTOR',
  DELIVERY_AGENT = 'DELIVERY_AGENT'
}

export enum PermissionCode {
  // Tenant
  TENANT_VIEW = 'tenant.view',
  TENANT_UPDATE = 'tenant.update',

  // Branch
  BRANCH_VIEW = 'branch.view',
  BRANCH_CREATE = 'branch.create',
  BRANCH_UPDATE = 'branch.update',
  BRANCH_DELETE = 'branch.delete',

  // User & Membership
  USER_VIEW = 'user.view',
  USER_INVITE = 'user.invite',
  USER_UPDATE = 'user.update',
  USER_REMOVE = 'user.remove',

  // Roles & RBAC
  ROLE_VIEW = 'role.view',
  ROLE_MANAGE = 'role.manage',

  // Settings
  SETTINGS_VIEW = 'settings.view',
  SETTINGS_MANAGE = 'settings.manage',

  // Category
  CATEGORY_VIEW = 'category.view',
  CATEGORY_CREATE = 'category.create',
  CATEGORY_UPDATE = 'category.update',
  CATEGORY_DELETE = 'category.delete',

  // Service
  SERVICE_VIEW = 'service.view',
  SERVICE_CREATE = 'service.create',
  SERVICE_UPDATE = 'service.update',
  SERVICE_DELETE = 'service.delete',

  // Product & Pricing
  PRODUCT_VIEW = 'product.view',
  PRODUCT_CREATE = 'product.create',
  PRODUCT_UPDATE = 'product.update',
  PRODUCT_DELETE = 'product.delete',
  PRICING_VIEW = 'pricing.view',
  PRICING_UPDATE = 'pricing.update',

  // Customer
  CUSTOMER_VIEW = 'customer.view',
  CUSTOMER_CREATE = 'customer.create',
  CUSTOMER_UPDATE = 'customer.update',
  CUSTOMER_DELETE = 'customer.delete',
  CUSTOMER_VIEW_BALANCE = 'customer.view_balance',
  CUSTOMER_MANAGE = 'customer.manage',
  CUSTOMER_NOTES = 'customer.notes',
  CUSTOMER_EXPORT = 'customer.export',
  CUSTOMER_PORTAL_MANAGE = 'customer.portal.manage',

  // Order
  ORDER_VIEW = 'order.view',
  ORDER_CREATE = 'order.create',
  ORDER_UPDATE = 'order.update',
  ORDER_CANCEL = 'order.cancel',
  ORDER_DELETE = 'order.delete',
  ORDER_STATUS_UPDATE = 'order.status_update',
  ORDER_STAGE_UPDATE = 'order.stage_update',

  // Garment
  GARMENT_VIEW = 'garment.view',
  GARMENT_CREATE = 'garment.create',
  GARMENT_UPDATE = 'garment.update',

  // Payment
  PAYMENT_VIEW = 'payment.view',
  PAYMENT_CREATE = 'payment.create',
  PAYMENT_REFUND = 'payment.refund',

  // Processing & Plant Workflow
  PROCESSING_VIEW = 'processing.view',
  PROCESSING_CREATE = 'processing.create',
  PROCESSING_MANAGE = 'processing.manage',
  PROCESSING_ASSIGN = 'processing.assign',
  PROCESSING_QC = 'processing.qc',
  PROCESSING_OVERRIDE = 'processing.override',
  PROCESSING_ISSUE_CREATE = 'processing.issue.create',
  PROCESSING_ISSUE_RESOLVE = 'processing.issue.resolve',
  PROCESSING_STAGE_MANAGE = 'processing.stage.manage',

  // Delivery & Dispatch
  DELIVERY_VIEW = 'delivery.view',
  DELIVERY_DISPATCH = 'delivery.dispatch',
  DELIVERY_UPDATE = 'delivery.update',

  // Reports & Audits
  REPORT_VIEW = 'report.view',
  REPORT_FINANCE_VIEW = 'report.finance.view',
  REPORT_EXPORT = 'report.export',
  AUDIT_VIEW = 'audit.view',

  // Staff & HR Management
  STAFF_VIEW = 'staff.view',
  STAFF_CREATE = 'staff.create',
  STAFF_UPDATE = 'staff.update',
  STAFF_DELETE = 'staff.delete',

  // Attendance
  ATTENDANCE_VIEW = 'attendance.view',
  ATTENDANCE_MANAGE = 'attendance.manage',
  ATTENDANCE_CORRECT = 'attendance.correct',

  // Shifts
  SHIFT_VIEW = 'shift.view',
  SHIFT_MANAGE = 'shift.manage',

  // Leave
  LEAVE_VIEW = 'leave.view',
  LEAVE_CREATE = 'leave.create',
  LEAVE_APPROVE = 'leave.approve',

  // Payroll
  PAYROLL_VIEW = 'payroll.view',
  PAYROLL_MANAGE = 'payroll.manage',
  PAYROLL_PROCESS = 'payroll.process',
  PAYROLL_APPROVE = 'payroll.approve',

  // Finance & Reporting
  FINANCE_VIEW = 'finance.view',
  FINANCE_REPORT = 'finance.report',

  // Expenses
  EXPENSE_VIEW = 'expense.view',
  EXPENSE_CREATE = 'expense.create',
  EXPENSE_UPDATE = 'expense.update',
  EXPENSE_DELETE = 'expense.delete',
  EXPENSE_APPROVE = 'expense.approve',
  EXPENSE_PAY = 'expense.pay',
  EXPENSE_CATEGORY_MANAGE = 'expense.category.manage',

  // Suppliers
  SUPPLIER_VIEW = 'supplier.view',
  SUPPLIER_CREATE = 'supplier.create',
  SUPPLIER_UPDATE = 'supplier.update',
  SUPPLIER_DELETE = 'supplier.delete',
  SUPPLIER_PAYMENT = 'supplier.payment',

  // Purchases
  PURCHASE_VIEW = 'purchase.view',
  PURCHASE_CREATE = 'purchase.create',
  PURCHASE_UPDATE = 'purchase.update',
  PURCHASE_APPROVE = 'purchase.approve',
  PURCHASE_PAY = 'purchase.pay',

  // Inventory & Stock
  INVENTORY_VIEW = 'inventory.view',
  INVENTORY_CREATE = 'inventory.create',
  INVENTORY_UPDATE = 'inventory.update',
  INVENTORY_DELETE = 'inventory.delete',
  INVENTORY_ADJUST = 'inventory.adjust',
  INVENTORY_TRANSFER = 'inventory.transfer',
  INVENTORY_MANAGE = 'inventory.manage',
  STOCK_VIEW = 'stock.view',
  STOCK_ADJUST = 'stock.adjust',
  STOCK_TRANSFER = 'stock.transfer',

  // Phase 07: Pickup & Delivery Logistics
  PICKUP_VIEW = 'pickup.view',
  PICKUP_CREATE = 'pickup.create',
  PICKUP_MANAGE = 'pickup.manage',
  PICKUP_ASSIGN = 'pickup.assign',
  PICKUP_COMPLETE = 'pickup.complete',
  PICKUP_CANCEL = 'pickup.cancel',

  DELIVERY_CREATE = 'delivery.create',
  DELIVERY_MANAGE = 'delivery.manage',
  DELIVERY_ASSIGN = 'delivery.assign',
  DELIVERY_COMPLETE = 'delivery.complete',
  DELIVERY_CANCEL = 'delivery.cancel',
  DELIVERY_COLLECTION = 'delivery.collection',
  DELIVERY_PROOF = 'delivery.proof',
  DELIVERY_REPORT = 'delivery.report',

  // Phase 08: Customer Communication, Notifications & WhatsApp
  NOTIFICATION_VIEW = 'notification.view',
  NOTIFICATION_SEND = 'notification.send',
  NOTIFICATION_RESEND = 'notification.resend',
  NOTIFICATION_MANAGE = 'notification.manage',
  NOTIFICATION_TEMPLATE_VIEW = 'notification.template.view',
  NOTIFICATION_TEMPLATE_CREATE = 'notification.template.create',
  NOTIFICATION_TEMPLATE_MANAGE = 'notification.template.manage',
  NOTIFICATION_SETTINGS_VIEW = 'notification.settings.view',
  NOTIFICATION_SETTINGS_MANAGE = 'notification.settings.manage',
  NOTIFICATION_REPORT = 'notification.report',
}

// Backwards compatibility enum alias
export const Permission = PermissionCode;
export type Permission = PermissionCode;

export enum OrderStatus {
  DRAFT = 'DRAFT',
  RECEIVED = 'RECEIVED',
  TAGGED = 'TAGGED',
  SORTING = 'SORTING',
  PROCESSING = 'PROCESSING',
  QC = 'QC',
  PACKED = 'PACKED',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum DiscountType {
  AMOUNT = 'AMOUNT',
  PERCENTAGE = 'PERCENTAGE'
}

export enum ProcessingStage {
  INTAKE = 'INTAKE',
  SORTING = 'SORTING',
  WASHING = 'WASHING',
  DRYING = 'DRYING',
  STEAM_PRESS = 'STEAM_PRESS',
  DRY_CLEAN_SOLVENT = 'DRY_CLEAN_SOLVENT',
  SHOE_SPA_RESTORE = 'SHOE_SPA_RESTORE',
  QC_INSPECTION = 'QC_INSPECTION',
  PACKING_HANGER = 'PACKING_HANGER',
  READY_SHELF = 'READY_SHELF'
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  VOID = 'VOID'
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  NET_BANKING = 'NET_BANKING',
  WALLET = 'WALLET',
  SPLIT = 'SPLIT',
  OTHER = 'OTHER'
}

export enum UnitType {
  PIECE = 'PIECE',
  KG = 'KG',
  PAIR = 'PAIR',
  METER = 'METER',
  DOZEN = 'DOZEN',
  BAG = 'BAG',
  SET = 'SET',
  CUSTOM = 'CUSTOM'
}

export enum PricingTier {
  REGULAR = 'REGULAR',
  EXPRESS = 'EXPRESS',
  SAME_DAY = 'SAME_DAY',
  URGENT = 'URGENT',
  CUSTOM = 'CUSTOM'
}

// Legacy alias
export const ServiceTier = {
  REGULAR: 'Regular',
  EXPRESS: 'Express',
  SAME_DAY: 'Same Day'
} as const;
export type ServiceTier = typeof ServiceTier[keyof typeof ServiceTier];

export enum GarmentCondition {
  GOOD = 'GOOD',
  MINOR_DAMAGE = 'MINOR_DAMAGE',
  DAMAGED = 'DAMAGED',
  STAINED = 'STAINED',
  COLOR_FADE = 'COLOR_FADE',
  NEW = 'NEW',
  WORN = 'WORN',
  DELICATE = 'DELICATE',
  PRE_DAMAGED = 'PRE_DAMAGED'
}

export enum GarmentProcessingStatus {
  RECEIVED = 'RECEIVED',
  SORTED = 'SORTED',
  PROCESSING = 'PROCESSING',
  QUALITY_CHECK = 'QUALITY_CHECK',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED'
}

export enum ProcessingJobStatus {
  QUEUED = 'QUEUED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ProcessingPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum QCResult {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  REWORK_REQUIRED = 'REWORK_REQUIRED'
}

export enum QCIssueType {
  STAIN_REMAINING = 'STAIN_REMAINING',
  DAMAGE_FOUND = 'DAMAGE_FOUND',
  COLOR_BLEED = 'COLOR_BLEED',
  WRINKLE = 'WRINKLE',
  BAD_ODOR = 'BAD_ODOR',
  MISSING_BUTTON = 'MISSING_BUTTON',
  MISSING_ACCESSORY = 'MISSING_ACCESSORY',
  WRONG_ITEM = 'WRONG_ITEM',
  OTHER = 'OTHER'
}

export enum ProcessingAction {
  STAGE_STARTED = 'STAGE_STARTED',
  STAGE_COMPLETED = 'STAGE_COMPLETED',
  STAGE_SKIPPED = 'STAGE_SKIPPED',
  STAGE_PAUSED = 'STAGE_PAUSED',
  STAGE_RESUMED = 'STAGE_RESUMED',
  ASSIGNED = 'ASSIGNED',
  UNASSIGNED = 'UNASSIGNED',
  QC_PASSED = 'QC_PASSED',
  QC_FAILED = 'QC_FAILED',
  QC_REWORK_REQUIRED = 'QC_REWORK_REQUIRED',
  QC_OVERRIDE = 'QC_OVERRIDE',
  ISSUE_REPORTED = 'ISSUE_REPORTED',
  ISSUE_RESOLVED = 'ISSUE_RESOLVED'
}

export enum ProcessingIssueSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ProcessingIssueStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED'
}

// Default Stage Codes for Workflows
export const DEFAULT_PROCESSING_STAGES = [
  { code: 'RECEIVED', name: 'Received / Intake', sequence: 1, color: '#6366f1', icon: 'Inbox' },
  { code: 'SORTING', name: 'Sorting & Inspection', sequence: 2, color: '#8b5cf6', icon: 'Filter' },
  { code: 'WASHING', name: 'Washing / Dry Cleaning', sequence: 3, color: '#0ea5e9', icon: 'Droplets' },
  { code: 'DRYING', name: 'Drying / Tumbling', sequence: 4, color: '#f59e0b', icon: 'Sun' },
  { code: 'IRONING', name: 'Ironing & Steam Press', sequence: 5, color: '#ec4899', icon: 'Flame' },
  { code: 'FINISHING', name: 'Finishing & Folding', sequence: 6, color: '#10b981', icon: 'Sparkles' },
  { code: 'QUALITY_CHECK', name: 'Quality Check (QC)', sequence: 7, color: '#e11d48', icon: 'CheckCircle2' },
  { code: 'READY', name: 'Ready on Shelf', sequence: 8, color: '#059669', icon: 'PackageCheck' }
] as const;

// ==========================================
// PHASE 05: STAFF, ATTENDANCE, SHIFTS, LEAVE & PAYROLL ENUMS
// ==========================================

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  TEMPORARY = 'TEMPORARY',
  INTERN = 'INTERN'
}

export enum StaffStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  LATE = 'LATE',
  LEAVE = 'LEAVE',
  HOLIDAY = 'HOLIDAY',
  WEEK_OFF = 'WEEK_OFF'
}

export enum AttendanceSource {
  WEB = 'WEB',
  POS = 'POS',
  MANUAL = 'MANUAL',
  SYSTEM = 'SYSTEM'
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum SalaryType {
  MONTHLY = 'MONTHLY',
  WEEKLY = 'WEEKLY',
  DAILY = 'DAILY',
  HOURLY = 'HOURLY'
}

export enum PayrollPeriodStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export enum SalaryAdvanceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DEDUCTED = 'DEDUCTED',
  CANCELLED = 'CANCELLED'
}

export const DEFAULT_LEAVE_TYPES = [
  { code: 'CASUAL', name: 'Casual Leave', paid: true, annualLimit: 12, requiresApproval: true },
  { code: 'SICK', name: 'Sick Leave', paid: true, annualLimit: 10, requiresApproval: true },
  { code: 'ANNUAL', name: 'Annual Leave', paid: true, annualLimit: 15, requiresApproval: true },
  { code: 'UNPAID', name: 'Unpaid Leave (LWP)', paid: false, annualLimit: 30, requiresApproval: true },
  { code: 'EMERGENCY', name: 'Emergency Leave', paid: true, annualLimit: 5, requiresApproval: true }
] as const;

// ==========================================
// INTERFACES
// ==========================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  businessType?: BusinessType;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  taxRegistrationNumber?: string;
  currency?: string;
  currencySymbol?: string;
  isActive?: boolean;
  status?: TenantStatus;
  plan?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Membership {
  id: string;
  userId: string;
  tenantId: string;
  roleId: string;
  branchIds: string[];
  status: MembershipStatus;
  user?: User;
  tenant?: Tenant;
  role?: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  tenantId?: string; // null for system template roles
  name: string;
  code: RoleType | string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  taxRate: number;
  isActive: boolean;
  isMainHub?: boolean;
  printerSettings?: {
    tagWidthMm: number;
    tagHeightMm: number;
    autoPrintOnOrder: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantSettings {
  id: string;
  tenantId: string;
  invoicePrefix: string;
  invoiceNumberStart: number;
  defaultTaxRate: number;
  currency: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
  orderStatuses?: string[];
  businessHours?: {
    open: string;
    close: string;
    daysOpen: string[];
  };
  receiptSettings?: {
    headerText?: string;
    footerText?: string;
    showGstNumber: boolean;
    showTermsAndConditions: boolean;
    terms?: string;
  };
  notificationSettings?: {
    smsEnabled: boolean;
    whatsappEnabled: boolean;
    emailEnabled: boolean;
  };
  branding?: {
    primaryColor?: string;
    accentColor?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  tenantId: string;
  branchId?: string;
  branchIds?: string[];
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  displayOrder?: number;
  productCount?: number;
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  code?: string;
  description?: string;
  multiplier?: number;
  displayOrder?: number;
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductPrice {
  regular: number;
  express: number;
  sameDay: number;
  urgent?: number;
  custom?: number;
}

export interface BranchPriceOverride {
  branchId: string;
  branchName?: string;
  prices: ProductPrice;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  categoryName?: string;
  serviceIds?: string[];
  name: string;
  sku?: string;
  description?: string;
  image?: string;
  icon?: string;
  unit: UnitType;
  prices: ProductPrice;
  branchPriceOverrides?: BranchPriceOverride[];
  branchAvailability?: string[]; // Array of branchIds where product is available
  taxRate?: number;
  taxPercent?: number;
  isTaxable?: boolean;
  processingTimeHours?: number;
  careInstructions?: string;
  instructions?: string;
  isActive: boolean;
  sortOrder?: number;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerAddress {
  id?: string;
  _id?: string;
  label?: string;
  name?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface Customer {
  id: string;
  tenantId: string;
  branchIds?: string[];
  branchId?: string;
  customerCode?: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  notes?: string;
  tags?: string[];
  address?: string;
  addresses?: CustomerAddress[];
  city?: string;
  pincode?: string;
  totalOrders?: number;
  totalSpent?: number;
  pendingBalance?: number;
  isVIP?: boolean;
  isVip?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Garment {
  id: string;
  tenantId?: string;
  branchId?: string;
  orderId: string;
  orderItemId?: string;
  garmentNumber?: string;
  productId: string;
  productName?: string;
  serviceId?: string;
  serviceName?: string;
  barcode?: string;
  qrCode?: string;
  garmentType?: string;
  quantity?: number;
  color?: string;
  brand?: string;
  condition: GarmentCondition;
  conditionNotes?: string;
  stainsNoted?: string[];
  damagesNoted?: string[];
  specialInstructions?: string;
  specialNotes?: string;
  photos?: string[];
  processingStatus?: GarmentProcessingStatus;
  stage?: ProcessingStage;
  isQCApproved?: boolean;
  shelfLocation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id?: string;
  productId: string;
  categoryId?: string;
  serviceId?: string;
  productName?: string;
  productNameSnapshot?: string;
  categoryName?: string;
  categoryNameSnapshot?: string;
  serviceName?: string;
  serviceNameSnapshot?: string;
  unit: UnitType;
  tier?: ServiceTier | PricingTier;
  pricingTier?: PricingTier;
  quantity: number;
  unitPrice: number;
  lineSubtotal?: number;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discountAmount?: number;
  lineTotal?: number;
  notes?: string;
  garmentColor?: string;
  garmentBrand?: string;
  defectsNoted?: string[];
  barcode?: string;
  garments?: Garment[];
}

export interface PaymentRecord {
  id: string;
  tenantId: string;
  branchId?: string;
  orderId: string;
  customerId?: string;
  paymentNumber?: string;
  amount: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  referenceNumber?: string;
  notes?: string;
  receivedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RefundRecord {
  id: string;
  tenantId: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  reason: string;
  method: PaymentMethod;
  approvedBy: string;
  createdAt?: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  label: string;
  timestamp: string;
  updatedBy: string;
  note?: string;
  isCompleted: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  tenantId: string;
  branchId: string;
  branchName?: string;
  customerId: string;
  customer?: {
    id?: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  status?: OrderStatus;
  orderStatus?: OrderStatus;
  items: OrderItem[];
  garments?: Garment[];
  garmentIds?: string[];
  itemCount: number;
  subtotal: number;
  discountType?: DiscountType;
  discountValue?: number;
  discount: number;
  discountAmount?: number;
  taxableAmount?: number;
  tax: number;
  taxAmount?: number;
  taxRate: number;
  total: number;
  grandTotal?: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  payments?: PaymentRecord[];
  refunds?: RefundRecord[];
  pricingTier?: PricingTier;
  notes?: string;
  internalNotes?: string;
  pickupRequired?: boolean;
  deliveryRequired?: boolean;
  timeline?: OrderTimelineEvent[];
  expectedDeliveryDate?: string;
  expectedReadyAt?: string;
  deliveredDate?: string;
  completedAt?: string;
  tags?: string[];
  express?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  branchId?: string;
  actorUserId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// ==========================================
// API ENVELOPE CONTRACTS
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUserPayload {
  user: User;
  tenant: Tenant;
  membership: Membership;
  role: Role;
  branches: Branch[];
  permissions: string[];
}

export interface AuthResponse extends AuthTokens {
  user: User;
  tenant: Tenant;
  membership: Membership;
  role: Role;
  branches: Branch[];
  permissions: string[];
}

export interface Driver {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  phone: string;
  vehicleNumber?: string;
  activeDeliveriesCount: number;
  isAvailable: boolean;
}

export interface DashboardMetrics {
  revenueToday: number;
  revenueChangePercent: number;
  ordersToday: number;
  ordersChangePercent: number;
  readyOrdersCount: number;
  pendingDeliveriesCount: number;
  dueAmountTotal: number;
  dueCustomersCount: number;
  weeklySales: { day: string; amount: number; orders: number }[];
  statusBreakdown: { status: OrderStatus; count: number; label: string; color: string }[];
  recentOrders: Order[];
  todayDeliveries: Order[];
}

// ==========================================
// PHASE 04: PROCESSING & PLANT WORKFLOW
// ==========================================

export interface ProcessingStageConfig {
  id: string;
  tenantId: string;
  branchId?: string;
  code: string;
  name: string;
  description?: string;
  sequence: number;
  color?: string;
  icon?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProcessingJob {
  id: string;
  tenantId: string;
  branchId: string;
  orderId: string;
  garmentId: string;
  currentStageId?: string;
  stageCode?: string;
  stageName?: string;
  status: ProcessingJobStatus;
  priority: ProcessingPriority;
  assignedUserId?: string;
  assignedUser?: { id: string; name: string; email: string };
  order?: Order;
  garment?: Garment;
  startedAt?: string;
  completedAt?: string;
  expectedCompletionAt?: string;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProcessingEvent {
  id: string;
  tenantId: string;
  branchId: string;
  processingJobId: string;
  orderId: string;
  garmentId: string;
  fromStage?: string;
  toStage?: string;
  action: ProcessingAction;
  actorUserId?: string;
  actorName?: string;
  notes?: string;
  timestamp: string;
}

export interface QualityCheck {
  id: string;
  tenantId: string;
  branchId: string;
  processingJobId: string;
  garmentId: string;
  orderId: string;
  inspectorUserId: string;
  inspectorName?: string;
  result: QCResult;
  issues?: QCIssueType[];
  notes?: string;
  isOverride?: boolean;
  overrideReason?: string;
  checkedAt: string;
}

export interface ProcessingIssue {
  id: string;
  tenantId: string;
  branchId: string;
  orderId: string;
  garmentId: string;
  processingJobId: string;
  type: string;
  severity: ProcessingIssueSeverity;
  description: string;
  reportedBy: string;
  reportedByName?: string;
  resolvedBy?: string;
  resolvedByName?: string;
  resolutionNotes?: string;
  status: ProcessingIssueStatus;
  createdAt: string;
  resolvedAt?: string;
}

// ==========================================
// PHASE 05: STAFF, ATTENDANCE, SHIFTS, LEAVE & PAYROLL INTERFACES
// ==========================================

export interface BankDetails {
  accountNumber?: string;
  accountNumberMasked?: string;
  ifscCode?: string;
  bankName?: string;
  accountHolderName?: string;
  upiId?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface SalaryConfiguration {
  salaryType: SalaryType;
  baseSalary: number; // in cents/paise
  hourlyRate?: number;
  overtimeRate?: number; // per hour rate in cents/paise
  allowances?: { name: string; amount: number }[];
  deductions?: { name: string; amount: number }[];
  effectiveFrom: string;
}

export interface StaffProfile {
  id: string;
  tenantId: string;
  userId: string;
  user?: User;
  membership?: Membership;
  employeeCode: string;
  joiningDate: string;
  employmentType: EmploymentType;
  designation?: string;
  department?: string;
  primaryBranchId: string;
  primaryBranch?: Branch;
  branchIds: string[];
  dateOfBirth?: string;
  emergencyContact?: EmergencyContact;
  address?: Address;
  bankDetails?: BankDetails;
  governmentId?: string;
  salaryConfiguration?: SalaryConfiguration;
  status: StaffStatus;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  tenantId: string;
  branchId: string;
  branch?: Branch;
  staffId: string;
  staff?: StaffProfile;
  userId: string;
  user?: User;
  date: string; // YYYY-MM-DD
  checkInAt?: string;
  checkOutAt?: string;
  status: AttendanceStatus;
  workMinutes: number;
  overtimeMinutes: number;
  source: AttendanceSource;
  notes?: string;
  correctionReason?: string;
  correctedBy?: string;
  correctedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShiftDefinition {
  id: string;
  tenantId: string;
  branchId?: string;
  name: string;
  code: string;
  startTime: string; // HH:mm (24-hour)
  endTime: string;   // HH:mm (24-hour)
  breakMinutes: number;
  graceMinutes: number;
  workingMinutes: number;
  isOvernight: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShiftAssignment {
  id: string;
  tenantId: string;
  branchId: string;
  staffId: string;
  staff?: StaffProfile;
  shiftId: string;
  shift?: ShiftDefinition;
  date: string; // YYYY-MM-DD
  isRecurring?: boolean;
  dayOfWeek?: number; // 0 (Sun) to 6 (Sat)
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveType {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  paid: boolean;
  annualLimit: number;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveRequest {
  id: string;
  tenantId: string;
  branchId: string;
  staffId: string;
  staff?: StaffProfile;
  leaveTypeId: string;
  leaveType?: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryRecord {
  id: string;
  tenantId: string;
  staffId: string;
  salaryType: SalaryType;
  baseSalary: number; // In cents/paise
  hourlyRate?: number;
  overtimeRate?: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  effectiveFrom: string;
  effectiveTo?: string;
  isCurrent: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayrollPeriod {
  id: string;
  tenantId: string;
  name: string; // e.g. "October 2026"
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: PayrollPeriodStatus;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalStaffCount: number;
  processedAt?: string;
  processedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayrollRecord {
  id: string;
  tenantId: string;
  branchId: string;
  payrollPeriodId: string;
  payrollPeriod?: PayrollPeriod;
  staffId: string;
  staff?: StaffProfile;
  salaryType: SalaryType;
  baseSalary: number;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  absentDays: number;
  regularHours: number;
  overtimeHours: number;
  overtimeAmount: number;
  allowances: { name: string; amount: number }[];
  totalAllowances: number;
  deductions: { name: string; amount: number }[];
  totalDeductions: number;
  grossSalary: number;
  advanceAmount: number;
  netSalary: number;
  status: PayrollPeriodStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryAdvance {
  id: string;
  tenantId: string;
  staffId: string;
  staff?: StaffProfile;
  amount: number; // in cents/paise
  requestedDate: string;
  approvedDate?: string;
  reason: string;
  status: SalaryAdvanceStatus;
  deductFromPayrollPeriodId?: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffWorkSummary {
  staffId: string;
  employeeCode: string;
  name: string;
  attendanceDays: number;
  presentDays: number;
  leaveDays: number;
  absentDays: number;
  totalWorkHours: number;
  overtimeHours: number;
  processingJobsAssigned: number;
  processingJobsCompleted: number;
  qcChecksCompleted: number;
  qcFailures: number;
}

// ==========================================
// Phase 06: Finance, Expenses, Inventory, Suppliers
// ==========================================

export enum ExpenseStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum ExpensePaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  OTHER = 'OTHER',
}

export enum PurchasePaymentStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum PurchaseStatus {
  DRAFT = 'DRAFT',
  ORDERED = 'ORDERED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export enum InventoryUnit {
  PIECE = 'PIECE',
  KG = 'KG',
  GRAM = 'GRAM',
  LITER = 'LITER',
  ML = 'ML',
  BOX = 'BOX',
  PACK = 'PACK',
  PACKET = 'PACKET',
  BAG = 'BAG',
  DOZEN = 'DOZEN',
  METER = 'METER',
  ROLL = 'ROLL',
  CAN = 'CAN',
  SET = 'SET',
  CUSTOM = 'CUSTOM',
}

export enum StockMovementType {
  INITIAL_STOCK = 'INITIAL_STOCK',
  PURCHASE = 'PURCHASE',
  PURCHASE_RECEIPT = 'PURCHASE_RECEIPT',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
  SALE_USAGE = 'SALE_USAGE',
  CONSUMPTION = 'CONSUMPTION',
  DAMAGE = 'DAMAGE',
  EXPIRY = 'EXPIRY',
  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  RETURN = 'RETURN',
  RETURN_TO_SUPPLIER = 'RETURN_TO_SUPPLIER',
  WASTE = 'WASTE',
  OPENING_BALANCE = 'OPENING_BALANCE',
  AUDIT_CORRECTION = 'AUDIT_CORRECTION',
}

export enum TransferStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Rent', code: 'RENT', description: 'Store & plant rental expenses', icon: 'Building2', color: '#6366F1' },
  { name: 'Electricity', code: 'ELECTRICITY', description: 'Power and grid utilities', icon: 'Zap', color: '#F59E0B' },
  { name: 'Water & Utilities', code: 'WATER', description: 'Water supply and municipal taxes', icon: 'Droplets', color: '#06B6D4' },
  { name: 'Staff Salaries', code: 'SALARY', description: 'Staff payroll and operational wages', icon: 'Users', color: '#10B981' },
  { name: 'Maintenance & Repairs', code: 'MAINTENANCE', description: 'Boilers, washers, and plant maintenance', icon: 'Wrench', color: '#EC4899' },
  { name: 'Transport & Fuel', code: 'TRANSPORT', description: 'Logistics, delivery van fuel and maintenance', icon: 'Truck', color: '#8B5CF6' },
  { name: 'Marketing & Ads', code: 'MARKETING', description: 'Promotions, digital ads, and printing', icon: 'Megaphone', color: '#F97316' },
  { name: 'Packaging Materials', code: 'PACKAGING', description: 'Bags, covers, tags, and garment wrapping', icon: 'Package', color: '#14B8A6' },
  { name: 'Chemicals & Supplies', code: 'SUPPLIES', description: 'Detergents, softeners, spotting chemicals', icon: 'FlaskConical', color: '#3B82F6' },
  { name: 'Software & SaaS', code: 'SOFTWARE', description: 'Washora SaaS subscriptions and IT', icon: 'Laptop', color: '#6366F1' },
  { name: 'Telephone & Internet', code: 'TELEPHONE', description: 'Broadband and phone bills', icon: 'Phone', color: '#84CC16' },
  { name: 'Other Operating Expenses', code: 'OTHER', description: 'Miscellaneous operational expenses', icon: 'MoreHorizontal', color: '#64748B' },
];

export const DEFAULT_INVENTORY_CATEGORIES = [
  { name: 'Detergents & Soaps', code: 'DETERGENT', description: 'Main washing chemicals & powders' },
  { name: 'Fabric Softeners', code: 'FABRIC_SOFTENER', description: 'Conditioners and fragrances' },
  { name: 'Bleach & Spotting Agents', code: 'BLEACH', description: 'Stain removers and color-safe bleaches' },
  { name: 'Packaging & Bags', code: 'PACKAGING', description: 'Plastic polybags, shirt boxes & garment rolls' },
  { name: 'Hangers & Clips', code: 'HANGERS', description: 'Wire, wooden, and plastic suit hangers' },
  { name: 'Tags & Barcodes', code: 'TAGS', description: 'Waterproof garment tags and thermal rolls' },
  { name: 'Shoe Care Supplies', code: 'SHOE_CARE', description: 'Shoe cleaning foams, brushes & conditioners' },
  { name: 'Cleaning & Plant Consumables', code: 'CLEANING_SUPPLIES', description: 'Gloves, towels, lint removers, boiler salt' },
  { name: 'Other Consumables', code: 'OTHER', description: 'Miscellaneous stock items' },
];

export interface ExpenseCategory {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  tenantId: string;
  branchId?: string;
  expenseNumber: string;
  categoryId: string;
  category?: ExpenseCategory;
  title: string;
  description?: string;
  amount: number; // in cents/paise
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod;
  supplierId?: string;
  supplier?: Supplier;
  status: ExpenseStatus;
  attachmentUrl?: string;
  referenceNumber?: string;
  notes?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  supplierCode: string;
  businessName: string;
  contactPerson?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  gstNumber?: string;
  address?: string;
  categories: string[];
  openingBalance: number; // in cents/paise
  currentBalance: number; // in cents/paise
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseItem {
  id?: string;
  tenantId: string;
  purchaseId: string;
  inventoryItemId: string;
  itemNameSnapshot: string;
  unit: InventoryUnit;
  quantity: number;
  unitCost: number; // in cents/paise
  taxRate?: number;
  taxAmount?: number;
  lineTotal: number; // in cents/paise
}

export interface Purchase {
  id: string;
  tenantId: string;
  branchId: string;
  supplierId: string;
  supplier?: Supplier;
  purchaseNumber: string;
  purchaseDate: string;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  status: PurchaseStatus;
  paymentStatus: PurchasePaymentStatus;
  items?: PurchaseItem[];
  notes?: string;
  createdBy?: string;
  receivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryCategory {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  branchId?: string;
  inventoryCode: string;
  categoryId: string;
  category?: InventoryCategory;
  name: string;
  description?: string;
  unit: InventoryUnit;
  currentStock: number;
  reservedStock: number;
  minimumStock: number;
  reorderLevel: number;
  averageCost: number; // in cents/paise
  lastPurchaseCost: number; // in cents/paise
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  branchId: string;
  inventoryItemId: string;
  item?: InventoryItem;
  type: StockMovementType;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  unitCost: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  performedBy?: string;
  createdAt?: string;
}

export interface InventoryTransfer {
  id: string;
  tenantId: string;
  fromBranchId: string;
  toBranchId: string;
  inventoryItemId: string;
  item?: InventoryItem;
  quantity: number;
  status: TransferStatus;
  requestedBy?: string;
  approvedBy?: string;
  completedAt?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierPayment {
  id: string;
  tenantId: string;
  branchId?: string;
  supplierId: string;
  supplier?: Supplier;
  paymentNumber: string;
  amount: number; // in cents/paise
  paymentMethod: ExpensePaymentMethod;
  referenceNumber?: string;
  paymentDate: string;
  purchaseId?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface FinanceDashboard {
  todayRevenue: number;
  todayExpenses: number;
  monthRevenue: number;
  monthExpenses: number;
  monthProfit: number;
  pendingCustomerPayments: number;
  pendingSupplierPayments: number;
  cashCollected: number;
  upiCollected: number;
  cardCollected: number;
  bankCollected: number;
  lowStockItemsCount: number;
  expenseCount: number;
  purchaseCount: number;
}

export interface FinanceRevenueReport {
  totalRevenue: number;
  byPaymentMethod: { method: string; count: number; total: number }[];
  byBranch: { branchId: string; branchName?: string; count: number; total: number }[];
  dailyTimeline: { date: string; total: number; count: number }[];
}

export interface FinanceExpenseReport {
  totalExpenses: number;
  byCategory: { categoryId: string; categoryName: string; count: number; total: number }[];
  byPaymentMethod: { method: string; count: number; total: number }[];
  byBranch: { branchId: string; branchName?: string; count: number; total: number }[];
  dailyTimeline: { date: string; total: number; count: number }[];
}

export interface FinanceProfitReport {
  totalRevenue: number;
  totalExpenses: number;
  operationalProfit: number;
  operatingMarginPercentage: number;
  timeline: { date: string; revenue: number; expenses: number; profit: number }[];
}

// ==========================================
// PHASE 07: PICKUP & DELIVERY LOGISTICS
// ==========================================

export enum PickupStatus {
  REQUESTED = 'REQUESTED',
  SCHEDULED = 'SCHEDULED',
  ASSIGNED = 'ASSIGNED',
  OUT_FOR_PICKUP = 'OUT_FOR_PICKUP',
  ARRIVED = 'ARRIVED',
  PICKED_UP = 'PICKED_UP',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum DeliveryStatus {
  REQUESTED = 'REQUESTED',
  SCHEDULED = 'SCHEDULED',
  ASSIGNED = 'ASSIGNED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum LogisticsPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export const PickupPriority = LogisticsPriority;
export type PickupPriority = LogisticsPriority;
export const DeliveryPriority = LogisticsPriority;
export type DeliveryPriority = LogisticsPriority;

export enum AddressType {
  HOME = 'HOME',
  OFFICE = 'OFFICE',
  OTHER = 'OTHER',
}

export enum PickupFailureReason {
  CUSTOMER_NOT_AVAILABLE = 'CUSTOMER_NOT_AVAILABLE',
  WRONG_ADDRESS = 'WRONG_ADDRESS',
  PHONE_UNREACHABLE = 'PHONE_UNREACHABLE',
  CUSTOMER_CANCELLED = 'CUSTOMER_CANCELLED',
  ACCESS_ISSUE = 'ACCESS_ISSUE',
  OTHER = 'OTHER',
}

export enum DeliveryFailureReason {
  CUSTOMER_NOT_AVAILABLE = 'CUSTOMER_NOT_AVAILABLE',
  WRONG_ADDRESS = 'WRONG_ADDRESS',
  PHONE_UNREACHABLE = 'PHONE_UNREACHABLE',
  CUSTOMER_REFUSED = 'CUSTOMER_REFUSED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  ACCESS_ISSUE = 'ACCESS_ISSUE',
  OTHER = 'OTHER',
}

export interface AddressSnapshot {
  label?: string;
  name?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface LogisticsAttempt {
  attemptNumber: number;
  attemptedAt: string;
  agentId?: string;
  agentName?: string;
  reason: PickupFailureReason | DeliveryFailureReason | string;
  notes?: string;
}

export interface RescheduleHistory {
  previousDate?: string;
  previousTimeFrom?: string;
  previousTimeTo?: string;
  newDate: string;
  newTimeFrom?: string;
  newTimeTo?: string;
  reason?: string;
  changedBy?: string;
  changedAt: string;
}

export interface ProofOfDelivery {
  recipientName?: string;
  recipientPhone?: string;
  deliveryNote?: string;
  signatureUrl?: string;
  photoUrl?: string;
  otpVerified?: boolean;
  otpVerifiedAt?: string;
}

export interface PickupRequest {
  id: string;
  _id?: string;
  tenantId: string;
  branchId: string;
  branch?: { id: string; name: string; code: string };
  pickupNumber: string;
  orderId?: string;
  order?: { id: string; orderNumber: string; grandTotal?: number; status?: string };
  customerId: string;
  customer?: { id: string; name: string; phone: string; email?: string };
  pickupAddressId?: string;
  pickupAddress: AddressSnapshot;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTimeFrom?: string; // HH:mm
  scheduledTimeTo?: string; // HH:mm
  assignedAgentId?: string;
  assignedAgent?: { id: string; name: string; phone?: string; employeeCode?: string };
  status: PickupStatus;
  priority: LogisticsPriority;
  specialInstructions?: string;
  customerNotes?: string;
  internalNotes?: string;
  attemptCount: number;
  lastAttemptAt?: string;
  attempts?: LogisticsAttempt[];
  rescheduleHistory?: RescheduleHistory[];
  outForPickupAt?: string;
  arrivedAt?: string;
  pickedUpAt?: string;
  cancellationReason?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryRequest {
  id: string;
  _id?: string;
  tenantId: string;
  branchId: string;
  branch?: { id: string; name: string; code: string };
  deliveryNumber: string;
  orderId: string;
  order?: { id: string; orderNumber: string; grandTotal?: number; paidAmount?: number; dueAmount?: number; status?: string };
  customerId: string;
  customer?: { id: string; name: string; phone: string; email?: string };
  deliveryAddressId?: string;
  deliveryAddress: AddressSnapshot;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTimeFrom?: string; // HH:mm
  scheduledTimeTo?: string; // HH:mm
  assignedAgentId?: string;
  assignedAgent?: { id: string; name: string; phone?: string; employeeCode?: string };
  status: DeliveryStatus;
  priority: LogisticsPriority;
  specialInstructions?: string;
  customerNotes?: string;
  internalNotes?: string;
  attemptCount: number;
  lastAttemptAt?: string;
  attempts?: LogisticsAttempt[];
  rescheduleHistory?: RescheduleHistory[];
  outForDeliveryAt?: string;
  arrivedAt?: string;
  deliveredAt?: string;
  proofOfDelivery?: ProofOfDelivery;
  collectionAmount?: number; // in cents/paise
  collectionPaymentMethod?: PaymentMethod | string;
  collectionPaymentId?: string;
  collectedBy?: string;
  collectedAt?: string;
  cancellationReason?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryAgentSummary {
  agentId: string;
  userId: string;
  name: string;
  phone?: string;
  employeeCode?: string;
  branchId?: string;
  branchName?: string;
  isActive: boolean;
  todayAssignedPickups: number;
  todayCompletedPickups: number;
  todayAssignedDeliveries: number;
  todayCompletedDeliveries: number;
  todayPendingJobs: number;
  todayFailedJobs: number;
  todayCashCollected: number;
}

export interface LogisticsDashboard {
  todayPickupsCount: number;
  todayDeliveriesCount: number;
  pendingAssignmentCount: number;
  outForPickupCount: number;
  outForDeliveryCount: number;
  completedTodayCount: number;
  failedTodayCount: number;
  totalCashCollectedToday: number;
  agents: DeliveryAgentSummary[];
  recentPickups: PickupRequest[];
  recentDeliveries: DeliveryRequest[];
}

// ==========================================
// PHASE 08: CUSTOMER COMMUNICATION, NOTIFICATIONS & WHATSAPP
// ==========================================

export enum NotificationChannel {
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  RCS = 'RCS',
  PUSH = 'PUSH',
}

export enum NotificationStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  SKIPPED = 'SKIPPED',
}

export enum NotificationEventType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  PROCESSING_STARTED = 'PROCESSING_STARTED',
  PROCESSING_STATUS_UPDATED = 'PROCESSING_STATUS_UPDATED',
  QC_COMPLETED = 'QC_COMPLETED',
  ORDER_READY = 'ORDER_READY',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  PICKUP_SCHEDULED = 'PICKUP_SCHEDULED',
  PICKUP_REMINDER = 'PICKUP_REMINDER',
  PICKUP_OUT_FOR_PICKUP = 'PICKUP_OUT_FOR_PICKUP',
  PICKUP_COMPLETED = 'PICKUP_COMPLETED',
  PICKUP_FAILED = 'PICKUP_FAILED',
  DELIVERY_SCHEDULED = 'DELIVERY_SCHEDULED',
  DELIVERY_REMINDER = 'DELIVERY_REMINDER',
  DELIVERY_OUT_FOR_DELIVERY = 'DELIVERY_OUT_FOR_DELIVERY',
  DELIVERY_COMPLETED = 'DELIVERY_COMPLETED',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_DUE = 'PAYMENT_DUE',
  INVOICE_READY = 'INVOICE_READY',
}

export enum TemplateStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISABLED = 'DISABLED',
}

export enum WhatsAppCategory {
  UTILITY = 'UTILITY',
  AUTHENTICATION = 'AUTHENTICATION',
  MARKETING = 'MARKETING',
}

export interface NotificationTemplate {
  id: string;
  _id?: string;
  tenantId: string;
  branchId?: string;
  name: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  templateKey: string;
  providerTemplateId?: string;
  language: string;
  category?: WhatsAppCategory;
  content: string;
  variables: string[];
  status: TemplateStatus;
  isActive: boolean;
  isDefault: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerNotificationPreferences {
  id?: string;
  _id?: string;
  tenantId: string;
  customerId: string;
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  transactionalEnabled: boolean;
  marketingEnabled: boolean;
  preferredLanguage: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WhatsAppSettings {
  id?: string;
  _id?: string;
  tenantId: string;
  enabled: boolean;
  provider: string; // 'META_OFFICIAL' | 'MOCK' | 'TWILIO'
  phoneNumberId?: string;
  businessAccountId?: string;
  accessTokenReference?: string; // masked in client responses
  webhookEnabled: boolean;
  webhookVerifyTokenReference?: string; // masked
  defaultLanguage: string;
  isConfigured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationAutomationRule {
  eventType: NotificationEventType;
  channel: NotificationChannel;
  enabled: boolean;
  templateKey?: string;
  templateId?: string;
}

export interface TenantNotificationAutomation {
  id?: string;
  _id?: string;
  tenantId: string;
  rules: NotificationAutomationRule[];
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationRecord {
  id: string;
  _id?: string;
  tenantId: string;
  branchId?: string;
  customerId?: string;
  customer?: { id: string; name: string; phone: string; email?: string };
  orderId?: string;
  order?: { id: string; orderNumber: string; grandTotal?: number; status?: string };
  eventType: NotificationEventType;
  channel: NotificationChannel;
  templateId?: string;
  templateKey?: string;
  recipient: string;
  renderedContent: string;
  variables?: Record<string, any>;
  status: NotificationStatus;
  providerMessageId?: string;
  providerResponse?: Record<string, any>;
  errorCode?: string;
  errorMessage?: string;
  attemptCount: number;
  idempotencyKey?: string;
  queuedAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationStats {
  total: number;
  queued: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  skipped: number;
}

// ==========================================
// PHASE 09: CUSTOMER CRM & PORTAL INTERFACES
// ==========================================

export enum CustomerAccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface CustomerAccount {
  id: string;
  _id?: string;
  tenantId: string;
  customerId: string;
  phone: string;
  email?: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  status: CustomerAccountStatus;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerProfile {
  id: string;
  customerId: string;
  customerCode?: string;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  preferredLanguage?: string;
  isVip?: boolean;
  totalOrders: number;
  totalSpent: number;
  pendingBalance: number;
  addresses: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerNote {
  id: string;
  _id?: string;
  tenantId: string;
  customerId: string;
  content: string;
  createdBy?: string;
  authorName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerOrderTrackingStep {
  key: string;
  label: string;
  description?: string;
  timestamp?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface CustomerOrderTracking {
  orderNumber: string;
  shopName: string;
  tenantName?: string;
  branchName: string;
  orderDate: string;
  placedAt?: string;
  expectedReadyAt?: string;
  overallStatus: string;
  currentStep: string;
  steps: CustomerOrderTrackingStep[];
  itemCount: number;
  itemsSummary?: {
    itemCount: number;
    items: Array<{
      name: string;
      quantity: number;
      serviceName?: string;
      status: string;
      color?: string;
      brand?: string;
    }>;
  };
  garments: Array<{
    name: string;
    quantity: number;
    serviceName?: string;
    status: string;
    color?: string;
    brand?: string;
  }>;
  paymentSummary: {
    total: number;
    paid: number;
    due: number;
    status: string;
    grandTotal?: number;
    paidAmount?: number;
    dueAmount?: number;
    paymentStatus?: string;
  };
  financialSummary?: {
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
    paymentStatus: string;
    total: number;
    paid: number;
    due: number;
    status: string;
  };
  pickup?: {
    pickupNumber: string;
    scheduledDate: string;
    timeSlot?: string;
    status: string;
  };
  delivery?: {
    deliveryNumber: string;
    scheduledDate: string;
    timeSlot?: string;
    status: string;
  };
}

export interface CustomerDashboardData {
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    pendingBalance: number;
  };
  tenant: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  stats: {
    activeOrdersCount: number;
    readyOrdersCount: number;
    amountDueTotal: number;
  };
  activeOrders: any[];
  recentOrders: any[];
  upcomingPickup?: any;
  upcomingDelivery?: any;
  recentNotifications: any[];
}

export interface CustomerActivityEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ==========================================
// PHASE 10: SAAS ADMINISTRATION, SUBSCRIPTIONS & MULTI-TENANT GOVERNANCE
// ==========================================

export enum PlatformAdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  PARTNER_ADMIN = 'PARTNER_ADMIN',
  SUPPORT_ADMIN = 'SUPPORT_ADMIN',
  BILLING_ADMIN = 'BILLING_ADMIN',
  READ_ONLY_ADMIN = 'READ_ONLY_ADMIN',
}

export enum PlatformPermission {
  DASHBOARD_VIEW = 'platform.dashboard.view',
  TENANTS_VIEW = 'platform.tenants.view',
  TENANTS_CREATE = 'platform.tenants.create',
  TENANTS_UPDATE = 'platform.tenants.update',
  TENANTS_ACTIVATE = 'platform.tenants.activate',
  TENANTS_SUSPEND = 'platform.tenants.suspend',
  TENANTS_ARCHIVE = 'platform.tenants.archive',
  TENANTS_VERIFY = 'platform.tenants.verify',
  TENANTS_IMPERSONATE = 'platform.tenants.impersonate',
  PARTNERS_VIEW = 'platform.partners.view',
  PARTNERS_CREATE = 'platform.partners.create',
  PARTNERS_UPDATE = 'platform.partners.update',
  PARTNERS_SUSPEND = 'platform.partners.suspend',
  PARTNER_CLIENTS_MANAGE = 'partner.clients.manage',
  PARTNER_REPORTS_VIEW = 'partner.reports.view',
  PLANS_VIEW = 'platform.plans.view',
  PLANS_CREATE = 'platform.plans.create',
  PLANS_UPDATE = 'platform.plans.update',
  PLANS_ARCHIVE = 'platform.plans.archive',
  SUBSCRIPTIONS_VIEW = 'platform.subscriptions.view',
  SUBSCRIPTIONS_CREATE = 'platform.subscriptions.create',
  SUBSCRIPTIONS_UPDATE = 'platform.subscriptions.update',
  SUBSCRIPTIONS_CANCEL = 'platform.subscriptions.cancel',
  SUBSCRIPTIONS_CHANGE_PLAN = 'platform.subscriptions.change_plan',
  BILLING_VIEW = 'platform.billing.view',
  BILLING_MANAGE = 'platform.billing.manage',
  USAGE_VIEW = 'platform.usage.view',
  AUDIT_VIEW = 'platform.audit.view',
  SYSTEM_HEALTH_VIEW = 'platform.system_health.view',
}

export const DEFAULT_PLATFORM_ROLE_PERMISSIONS: Record<PlatformAdminRole, PlatformPermission[]> = {
  [PlatformAdminRole.SUPER_ADMIN]: Object.values(PlatformPermission),
  [PlatformAdminRole.PLATFORM_ADMIN]: [
    PlatformPermission.DASHBOARD_VIEW,
    PlatformPermission.TENANTS_VIEW,
    PlatformPermission.TENANTS_CREATE,
    PlatformPermission.TENANTS_UPDATE,
    PlatformPermission.TENANTS_ACTIVATE,
    PlatformPermission.TENANTS_SUSPEND,
    PlatformPermission.TENANTS_VERIFY,
    PlatformPermission.TENANTS_IMPERSONATE,
    PlatformPermission.PARTNERS_VIEW,
    PlatformPermission.PARTNERS_CREATE,
    PlatformPermission.PARTNERS_UPDATE,
    PlatformPermission.PARTNERS_SUSPEND,
    PlatformPermission.PLANS_VIEW,
    PlatformPermission.PLANS_CREATE,
    PlatformPermission.PLANS_UPDATE,
    PlatformPermission.SUBSCRIPTIONS_VIEW,
    PlatformPermission.SUBSCRIPTIONS_CREATE,
    PlatformPermission.SUBSCRIPTIONS_UPDATE,
    PlatformPermission.SUBSCRIPTIONS_CHANGE_PLAN,
    PlatformPermission.BILLING_VIEW,
    PlatformPermission.USAGE_VIEW,
    PlatformPermission.AUDIT_VIEW,
    PlatformPermission.SYSTEM_HEALTH_VIEW,
  ],
  [PlatformAdminRole.PARTNER_ADMIN]: [
    PlatformPermission.DASHBOARD_VIEW,
    PlatformPermission.PARTNER_CLIENTS_MANAGE,
    PlatformPermission.PARTNER_REPORTS_VIEW,
  ],
  [PlatformAdminRole.SUPPORT_ADMIN]: [
    PlatformPermission.DASHBOARD_VIEW,
    PlatformPermission.TENANTS_VIEW,
    PlatformPermission.TENANTS_VERIFY,
    PlatformPermission.PLANS_VIEW,
    PlatformPermission.SUBSCRIPTIONS_VIEW,
    PlatformPermission.USAGE_VIEW,
    PlatformPermission.SYSTEM_HEALTH_VIEW,
  ],
  [PlatformAdminRole.BILLING_ADMIN]: [
    PlatformPermission.DASHBOARD_VIEW,
    PlatformPermission.TENANTS_VIEW,
    PlatformPermission.PLANS_VIEW,
    PlatformPermission.SUBSCRIPTIONS_VIEW,
    PlatformPermission.SUBSCRIPTIONS_CREATE,
    PlatformPermission.SUBSCRIPTIONS_UPDATE,
    PlatformPermission.SUBSCRIPTIONS_CANCEL,
    PlatformPermission.SUBSCRIPTIONS_CHANGE_PLAN,
    PlatformPermission.BILLING_VIEW,
    PlatformPermission.BILLING_MANAGE,
    PlatformPermission.USAGE_VIEW,
  ],
  [PlatformAdminRole.READ_ONLY_ADMIN]: [
    PlatformPermission.DASHBOARD_VIEW,
    PlatformPermission.TENANTS_VIEW,
    PlatformPermission.PLANS_VIEW,
    PlatformPermission.SUBSCRIPTIONS_VIEW,
    PlatformPermission.BILLING_VIEW,
    PlatformPermission.USAGE_VIEW,
    PlatformPermission.AUDIT_VIEW,
    PlatformPermission.SYSTEM_HEALTH_VIEW,
  ],
};

export enum SubscriptionStatus {
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum FeatureKey {
  POS = 'POS',
  CUSTOMERS = 'CUSTOMERS',
  ORDERS = 'ORDERS',
  PROCESSING = 'PROCESSING',
  QC = 'QC',
  STAFF = 'STAFF',
  ATTENDANCE = 'ATTENDANCE',
  PAYROLL = 'PAYROLL',
  EXPENSES = 'EXPENSES',
  SUPPLIERS = 'SUPPLIERS',
  PURCHASES = 'PURCHASES',
  INVENTORY = 'INVENTORY',
  FINANCE = 'FINANCE',
  PICKUP_DELIVERY = 'PICKUP_DELIVERY',
  NOTIFICATIONS = 'NOTIFICATIONS',
  WHATSAPP = 'WHATSAPP',
  CUSTOMER_PORTAL = 'CUSTOMER_PORTAL',
  CRM = 'CRM',
  REPORTS = 'REPORTS',
  MULTI_BRANCH = 'MULTI_BRANCH',
}

export enum LimitKey {
  MAX_BRANCHES = 'MAX_BRANCHES',
  MAX_STAFF = 'MAX_STAFF',
  MAX_CUSTOMERS = 'MAX_CUSTOMERS',
  MAX_MONTHLY_ORDERS = 'MAX_MONTHLY_ORDERS',
  MAX_USERS = 'MAX_USERS',
  MAX_PRODUCTS = 'MAX_PRODUCTS',
  MAX_INVENTORY_ITEMS = 'MAX_INVENTORY_ITEMS',
  MAX_WHATSAPP_MESSAGES = 'MAX_WHATSAPP_MESSAGES',
  MAX_STORAGE = 'MAX_STORAGE',
}

export enum BillingInvoiceStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  PAID = 'PAID',
  VOID = 'VOID',
  UNCOLLECTIBLE = 'UNCOLLECTIBLE',
}

export enum BillingPaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum SubscriptionHistoryEventType {
  CREATED = 'CREATED',
  TRIAL_STARTED = 'TRIAL_STARTED',
  ACTIVATED = 'ACTIVATED',
  PLAN_CHANGED = 'PLAN_CHANGED',
  BILLING_INTERVAL_CHANGED = 'BILLING_INTERVAL_CHANGED',
  PAST_DUE = 'PAST_DUE',
  REACTIVATED = 'REACTIVATED',
  CANCEL_REQUESTED = 'CANCEL_REQUESTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface PlatformAdminUser {
  id: string;
  _id?: string;
  email: string;
  name: string;
  role: PlatformAdminRole;
  permissions: PlatformPermission[];
  isActive: boolean;
  partnerId?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Partner {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  code: string;
  commissionRate?: number;
  isActive: boolean;
  assignedTenantIds?: string[];
  metrics?: {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    monthlyRevenue: number;
    estimatedCommission?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionPlan {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  billingInterval: BillingInterval;
  price: number;
  currency: string;
  trialDays: number;
  isActive: boolean;
  isPublic: boolean;
  features: Record<FeatureKey | string, boolean>;
  limits: Record<LimitKey | string, number>;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantSubscription {
  id: string;
  _id?: string;
  tenantId: string;
  planId: string;
  plan?: SubscriptionPlan;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  startDate: string;
  trialStart?: string;
  trialEnd?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  gracePeriodEnd?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionHistory {
  id: string;
  _id?: string;
  tenantId: string;
  subscriptionId: string;
  event: SubscriptionHistoryEventType;
  previousState?: Record<string, any>;
  newState: Record<string, any>;
  actorId?: string;
  actorType: 'PLATFORM_ADMIN' | 'TENANT_OWNER' | 'SYSTEM';
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface BillingInvoice {
  id: string;
  _id?: string;
  invoiceNumber: string; // e.g. SINV-000001
  tenantId: string;
  subscriptionId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: BillingInvoiceStatus;
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BillingPayment {
  id: string;
  _id?: string;
  paymentNumber: string; // e.g. SPAY-000001
  tenantId: string;
  invoiceId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: BillingPaymentStatus;
  provider: string; // e.g. 'MOCK_GATEWAY', 'RAZORPAY', 'STRIPE'
  providerPaymentId?: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantUsageSummary {
  tenantId: string;
  tenantName: string;
  planName: string;
  metrics: {
    branches: { current: number; limit: number; percentage: number };
    staff: { current: number; limit: number; percentage: number };
    customers: { current: number; limit: number; percentage: number };
    monthlyOrders: { current: number; limit: number; percentage: number };
    users: { current: number; limit: number; percentage: number };
    products: { current: number; limit: number; percentage: number };
    inventoryItems: { current: number; limit: number; percentage: number };
  };
  warnings: string[];
}

export interface PlatformDashboardData {
  metrics: {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    pastDueTenants: number;
    suspendedTenants: number;
    mrr: number;
    arr: number;
    activeSubscriptions: number;
  };
  tenantsByStatus: Record<string, number>;
  recentSubscriptions: any[];
  recentTenants: any[];
  recentAuditLogs: any[];
}

export interface Tenant360Overview {
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: TenantStatus;
    businessType: string;
    isVerified: boolean;
    createdAt: string;
  };
  owner: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  subscription?: {
    id: string;
    planName: string;
    status: SubscriptionStatus;
    billingInterval: BillingInterval;
    currentPeriodEnd: string;
    trialEnd?: string;
    price: number;
  };
  stats: {
    branchesCount: number;
    staffCount: number;
    customersCount: number;
    ordersCount: number;
    totalRevenue: number;
  };
  usage: TenantUsageSummary;
}

export interface SystemHealthReport {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  timestamp: string;
  environment: string;
  version: string;
  uptimeSeconds: number;
  database: {
    connected: boolean;
    state: string;
    pingMs: number;
  };
  memory: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
  };
}

// ==========================================
// PHASE 11: ADVANCED REPORTING, ANALYTICS & BI
// ==========================================

export enum ReportDateRangePreset {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  THIS_WEEK = 'THIS_WEEK',
  LAST_WEEK = 'LAST_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  THIS_QUARTER = 'THIS_QUARTER',
  LAST_QUARTER = 'LAST_QUARTER',
  THIS_YEAR = 'THIS_YEAR',
  LAST_YEAR = 'LAST_YEAR',
  CUSTOM = 'CUSTOM',
}

export enum CustomerSegment {
  NEW = 'NEW',
  RETURNING = 'RETURNING',
  HIGH_VALUE = 'HIGH_VALUE',
  INACTIVE = 'INACTIVE',
  AT_RISK = 'AT_RISK',
}

export interface MetricDelta {
  current: number;
  previous: number;
  absoluteChange: number;
  percentageChange: number | null; // null if previous was 0 (avoids Infinity%)
  trend: 'UP' | 'DOWN' | 'FLAT';
}

export interface TimelineDataPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  label: string;
  revenue: number;
  ordersCount: number;
  collectedPayments: number;
  expenses: number;
}

export interface ExecutiveDashboardReport {
  period: {
    from: string;
    to: string;
    preset?: ReportDateRangePreset;
  };
  kpis: {
    grossRevenue: MetricDelta;
    netRevenue: MetricDelta;
    totalOrders: MetricDelta;
    averageOrderValue: MetricDelta;
    activeCustomers: MetricDelta;
    pendingOrdersCount: number;
    completedOrdersCount: number;
    totalExpenses: MetricDelta;
    estimatedOperationalProfit: MetricDelta;
    profitMarginPercent: number;
    outstandingReceivables: number;
    qcPassRate: number;
    pickupSuccessRate: number;
    deliverySuccessRate: number;
  };
  timeline: TimelineDataPoint[];
  topServices: {
    serviceId: string;
    serviceName: string;
    categoryName: string;
    quantity: number;
    revenue: number;
    sharePercent: number;
  }[];
  branchBreakdown: {
    branchId: string;
    branchName: string;
    revenue: number;
    ordersCount: number;
    sharePercent: number;
  }[];
  bottlenecks: {
    stage: string;
    count: number;
    avgMinutesInStage: number;
  }[];
}

export interface SalesReport {
  summary: {
    grossSales: number;
    totalDiscounts: number;
    netSales: number;
    totalTax: number;
    collectedPayments: number;
    outstandingBalance: number;
    refundedAmount: number;
    averageOrderValue: number;
    totalOrders: number;
  };
  comparison?: {
    grossSales: MetricDelta;
    netSales: MetricDelta;
    totalOrders: MetricDelta;
    averageOrderValue: MetricDelta;
  };
  timeline: TimelineDataPoint[];
  byBranch: {
    branchId: string;
    branchName: string;
    grossSales: number;
    netSales: number;
    ordersCount: number;
    collectedPayments: number;
  }[];
  byCategory: {
    categoryId: string;
    categoryName: string;
    quantity: number;
    revenue: number;
    percentage: number;
  }[];
  byPaymentMethod: {
    method: string;
    amount: number;
    transactionsCount: number;
    percentage: number;
  }[];
}

export interface OrdersReport {
  summary: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    averageTurnaroundHours: number;
    onTimeDeliveryRate: number;
  };
  statusDistribution: {
    status: string;
    count: number;
    percentage: number;
  }[];
  stageBottlenecks: {
    stage: string;
    activeJobsCount: number;
    avgDurationMinutes: number;
  }[];
  speedTierRatio: {
    tier: 'REGULAR' | 'EXPRESS' | 'SAME_DAY';
    ordersCount: number;
    revenue: number;
    percentage: number;
  }[];
  timeline: {
    date: string;
    createdCount: number;
    completedCount: number;
    cancelledCount: number;
  }[];
}

export interface CustomersReport {
  summary: {
    totalCustomers: number;
    newCustomersCount: number;
    returningCustomersCount: number;
    averageLifetimeSpend: number;
    averageOrdersPerCustomer: number;
    repeatCustomerRate: number;
  };
  segments: {
    segment: CustomerSegment;
    label: string;
    count: number;
    totalSpend: number;
    percentage: number;
  }[];
  topCustomers: {
    customerId: string;
    name: string;
    phone: string;
    totalOrders: number;
    totalSpend: number;
    outstandingBalance: number;
    lastOrderDate: string;
    segment: CustomerSegment;
  }[];
  retentionCohorts: {
    firstOrderMonth: string;
    newCustomers: number;
    retainedMonth1: number;
    retainedMonth2: number;
    retainedMonth3: number;
  }[];
  timeline: {
    date: string;
    newCustomers: number;
    activeOrderingCustomers: number;
  }[];
}

export interface ServicesReport {
  topServices: {
    serviceId: string;
    serviceName: string;
    categoryName: string;
    quantity: number;
    revenue: number;
    orderCount: number;
    averageUnitPrice: number;
  }[];
  topProducts: {
    productId: string;
    productName: string;
    categoryName: string;
    quantity: number;
    revenue: number;
  }[];
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    itemCount: number;
    revenue: number;
    percentage: number;
  }[];
}

export interface BranchesReport {
  branches: {
    branchId: string;
    branchName: string;
    code: string;
    revenue: number;
    ordersCount: number;
    averageOrderValue: number;
    expenses: number;
    estimatedProfit: number;
    activeStaffCount: number;
    customerCount: number;
    revenueSharePercent: number;
  }[];
}

export interface PaymentsReport {
  summary: {
    totalCollected: number;
    totalPending: number;
    totalRefunded: number;
    transactionsCount: number;
  };
  byMethod: {
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  byBranch: {
    branchId: string;
    branchName: string;
    collected: number;
    pending: number;
  }[];
  timeline: {
    date: string;
    collected: number;
    refunded: number;
  }[];
}

export interface FinanceReport {
  summary: {
    grossRevenue: number;
    netRevenue: number;
    collectedPayments: number;
    totalExpenses: number;
    inventoryPurchases: number;
    payrollExpenses: number;
    estimatedOperationalProfit: number;
    profitMarginPercent: number;
  };
  comparison?: {
    revenue: MetricDelta;
    expenses: MetricDelta;
    estimatedProfit: MetricDelta;
  };
  expenseBreakdownByCategory: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  monthlyCashFlow: {
    month: string;
    revenue: number;
    expenses: number;
    purchases: number;
    payroll: number;
    netCashFlow: number;
  }[];
}

export interface ExpensesReport {
  summary: {
    totalExpenses: number;
    recurringExpenses: number;
    oneTimeExpenses: number;
    expensesCount: number;
  };
  byCategory: {
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  byBranch: {
    branchId: string;
    branchName: string;
    amount: number;
    percentage: number;
  }[];
  topExpenses: {
    id: string;
    title: string;
    category: string;
    amount: number;
    date: string;
    branchName?: string;
  }[];
}

export interface InventoryReport {
  summary: {
    totalStockValue: number;
    totalItemsCount: number;
    lowStockItemsCount: number;
    outOfStockItemsCount: number;
    totalConsumptionValue: number;
  };
  lowStockAlerts: {
    itemId: string;
    name: string;
    sku: string;
    currentStock: number;
    minThreshold: number;
    unit: string;
    unitPrice: number;
    deficit: number;
  }[];
  topConsumedItems: {
    itemId: string;
    name: string;
    quantityConsumed: number;
    totalConsumptionCost: number;
    unit: string;
  }[];
  valuationByBranch: {
    branchId: string;
    branchName: string;
    totalItems: number;
    stockValue: number;
  }[];
}

export interface SuppliersReport {
  summary: {
    totalPurchasesAmount: number;
    totalPaidAmount: number;
    outstandingBalance: number;
    activeSuppliersCount: number;
    purchaseOrdersCount: number;
  };
  topSuppliers: {
    supplierId: string;
    name: string;
    totalPurchases: number;
    totalPaid: number;
    outstandingBalance: number;
    purchaseOrdersCount: number;
  }[];
}

export interface ProcessingReport {
  summary: {
    totalJobs: number;
    completedJobs: number;
    activeJobs: number;
    failedJobs: number;
    reworkCount: number;
    averageCycleTimeMinutes: number;
    reworkRatePercent: number;
  };
  stageMetrics: {
    stage: string;
    jobsProcessed: number;
    currentlyInStage: number;
    averageMinutes: number;
  }[];
  operatorWorkloads: {
    operatorId: string;
    operatorName: string;
    jobsCompleted: number;
    qcPassRate: number;
  }[];
}

export interface QcReport {
  summary: {
    totalInspections: number;
    passedCount: number;
    failedCount: number;
    reworkCount: number;
    passRatePercent: number;
    failRatePercent: number;
    reworkRatePercent: number;
  };
  issuesByType: {
    issueType: string;
    count: number;
    percentage: number;
  }[];
  issuesBySeverity: {
    severity: string;
    count: number;
    percentage: number;
  }[];
}

export interface StaffPerformanceReport {
  summary: {
    totalStaff: number;
    averageAttendanceRate: number;
    totalWorkingHours: number;
    totalOvertimeHours: number;
  };
  staffList: {
    staffId: string;
    name: string;
    roleName: string;
    branchName: string;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    workingHours: number;
    jobsProcessed?: number;
    deliveriesCompleted?: number;
  }[];
}

export interface LogisticsReport {
  summary: {
    totalPickups: number;
    completedPickups: number;
    failedPickups: number;
    pickupSuccessRate: number;
    totalDeliveries: number;
    completedDeliveries: number;
    failedDeliveries: number;
    deliverySuccessRate: number;
    averageDeliveryHours: number;
  };
  agentPerformance: {
    agentId: string;
    agentName: string;
    pickupsAssigned: number;
    pickupsCompleted: number;
    deliveriesAssigned: number;
    deliveriesCompleted: number;
    successRatePercent: number;
  }[];
  timeline: {
    date: string;
    completedPickups: number;
    completedDeliveries: number;
  }[];
}

export interface NotificationsReport {
  summary: {
    totalQueued: number;
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    overallDeliveryRate: number;
  };
  byChannel: {
    channel: string;
    sent: number;
    delivered: number;
    failed: number;
    deliveryRatePercent: number;
  }[];
}

export interface PlatformGrowthAnalytics {
  tenants: {
    total: number;
    active: number;
    trial: number;
    pastDue: number;
    suspended: number;
    cancelled: number;
    newThisMonth: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    averageRevenuePerTenant: number;
  };
  planDistribution: {
    planId: string;
    planName: string;
    activeCount: number;
    percentage: number;
    mrrContribution: number;
  }[];
  growthTimeline: {
    month: string;
    newTenants: number;
    churnedTenants: number;
    netGrowth: number;
    mrr: number;
  }[];
}


