import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from '../../schemas/role.schema';
import { RoleType, PermissionCode } from '@washora/shared';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
  ) {}

  getDefaultPermissionsForRole(roleCode: string): string[] {
    switch (roleCode) {
      case RoleType.SHOP_OWNER:
      case RoleType.SUPER_ADMIN:
        return Object.values(PermissionCode);

      case RoleType.BRANCH_MANAGER:
        return [
          PermissionCode.BRANCH_VIEW,
          PermissionCode.BRANCH_UPDATE,
          PermissionCode.USER_VIEW,
          PermissionCode.USER_INVITE,
          PermissionCode.CATEGORY_VIEW,
          PermissionCode.CATEGORY_CREATE,
          PermissionCode.CATEGORY_UPDATE,
          PermissionCode.SERVICE_VIEW,
          PermissionCode.PRODUCT_VIEW,
          PermissionCode.PRODUCT_CREATE,
          PermissionCode.PRODUCT_UPDATE,
          PermissionCode.PRICING_VIEW,
          PermissionCode.PRICING_UPDATE,
          PermissionCode.CUSTOMER_VIEW,
          PermissionCode.CUSTOMER_CREATE,
          PermissionCode.CUSTOMER_UPDATE,
          PermissionCode.ORDER_VIEW,
          PermissionCode.ORDER_CREATE,
          PermissionCode.ORDER_UPDATE,
          PermissionCode.ORDER_CANCEL,
          PermissionCode.ORDER_STAGE_UPDATE,
          PermissionCode.PAYMENT_VIEW,
          PermissionCode.PAYMENT_CREATE,
          PermissionCode.DELIVERY_VIEW,
          PermissionCode.DELIVERY_DISPATCH,
          PermissionCode.DELIVERY_UPDATE,
          PermissionCode.REPORT_VIEW,
          PermissionCode.SETTINGS_VIEW,
          PermissionCode.PROCESSING_VIEW,
          PermissionCode.PROCESSING_CREATE,
          PermissionCode.PROCESSING_MANAGE,
          PermissionCode.PROCESSING_ASSIGN,
          PermissionCode.PROCESSING_QC,
          PermissionCode.PROCESSING_OVERRIDE,
          PermissionCode.PROCESSING_ISSUE_CREATE,
          PermissionCode.PROCESSING_ISSUE_RESOLVE,
          PermissionCode.PROCESSING_STAGE_MANAGE,
          // Phase 05: Staff & HR
          PermissionCode.STAFF_VIEW,
          PermissionCode.STAFF_CREATE,
          PermissionCode.STAFF_UPDATE,
          PermissionCode.ATTENDANCE_VIEW,
          PermissionCode.ATTENDANCE_MANAGE,
          PermissionCode.ATTENDANCE_CORRECT,
          PermissionCode.SHIFT_VIEW,
          PermissionCode.SHIFT_MANAGE,
          PermissionCode.LEAVE_VIEW,
          PermissionCode.LEAVE_CREATE,
          PermissionCode.LEAVE_APPROVE,
          PermissionCode.PAYROLL_VIEW,
          PermissionCode.PAYROLL_MANAGE,
          PermissionCode.PAYROLL_PROCESS,
          PermissionCode.PAYROLL_APPROVE,
          // Phase 06: Finance, Expenses, Suppliers, Purchases, Inventory
          PermissionCode.FINANCE_VIEW,
          PermissionCode.FINANCE_REPORT,
          PermissionCode.EXPENSE_VIEW,
          PermissionCode.EXPENSE_CREATE,
          PermissionCode.EXPENSE_UPDATE,
          PermissionCode.EXPENSE_DELETE,
          PermissionCode.EXPENSE_APPROVE,
          PermissionCode.EXPENSE_PAY,
          PermissionCode.EXPENSE_CATEGORY_MANAGE,
          PermissionCode.SUPPLIER_VIEW,
          PermissionCode.SUPPLIER_CREATE,
          PermissionCode.SUPPLIER_UPDATE,
          PermissionCode.SUPPLIER_DELETE,
          PermissionCode.SUPPLIER_PAYMENT,
          PermissionCode.PURCHASE_VIEW,
          PermissionCode.PURCHASE_CREATE,
          PermissionCode.PURCHASE_UPDATE,
          PermissionCode.PURCHASE_APPROVE,
          PermissionCode.PURCHASE_PAY,
          PermissionCode.INVENTORY_VIEW,
          PermissionCode.INVENTORY_CREATE,
          PermissionCode.INVENTORY_UPDATE,
          PermissionCode.INVENTORY_DELETE,
          PermissionCode.INVENTORY_ADJUST,
          PermissionCode.INVENTORY_TRANSFER,
          PermissionCode.INVENTORY_MANAGE,
          PermissionCode.STOCK_VIEW,
          PermissionCode.STOCK_ADJUST,
          PermissionCode.STOCK_TRANSFER,
          // Phase 07: Pickup & Delivery Logistics
          PermissionCode.PICKUP_VIEW,
          PermissionCode.PICKUP_CREATE,
          PermissionCode.PICKUP_MANAGE,
          PermissionCode.PICKUP_ASSIGN,
          PermissionCode.PICKUP_COMPLETE,
          PermissionCode.PICKUP_CANCEL,
          PermissionCode.DELIVERY_VIEW,
          PermissionCode.DELIVERY_CREATE,
          PermissionCode.DELIVERY_MANAGE,
          PermissionCode.DELIVERY_ASSIGN,
          PermissionCode.DELIVERY_COMPLETE,
          PermissionCode.DELIVERY_CANCEL,
          PermissionCode.DELIVERY_COLLECTION,
          PermissionCode.DELIVERY_PROOF,
          PermissionCode.DELIVERY_REPORT,
          // Phase 08: Customer Communication & Notifications
          PermissionCode.NOTIFICATION_VIEW,
          PermissionCode.NOTIFICATION_SEND,
          PermissionCode.NOTIFICATION_RESEND,
          PermissionCode.NOTIFICATION_MANAGE,
          PermissionCode.NOTIFICATION_TEMPLATE_VIEW,
          PermissionCode.NOTIFICATION_TEMPLATE_CREATE,
          PermissionCode.NOTIFICATION_SETTINGS_VIEW,
          PermissionCode.NOTIFICATION_REPORT,
          // Phase 09: Customer CRM & Portal
          PermissionCode.CUSTOMER_MANAGE,
          PermissionCode.CUSTOMER_NOTES,
          PermissionCode.CUSTOMER_EXPORT,
          PermissionCode.CUSTOMER_PORTAL_MANAGE,
        ];

      case RoleType.CASHIER:
        return [
          PermissionCode.BRANCH_VIEW,
          PermissionCode.CATEGORY_VIEW,
          PermissionCode.SERVICE_VIEW,
          PermissionCode.PRODUCT_VIEW,
          PermissionCode.PRICING_VIEW,
          PermissionCode.CUSTOMER_VIEW,
          PermissionCode.CUSTOMER_CREATE,
          PermissionCode.CUSTOMER_UPDATE,
          PermissionCode.CUSTOMER_NOTES,
          PermissionCode.ORDER_VIEW,
          PermissionCode.ORDER_CREATE,
          PermissionCode.ORDER_UPDATE,
          PermissionCode.ORDER_STAGE_UPDATE,
          PermissionCode.PAYMENT_VIEW,
          PermissionCode.PAYMENT_CREATE,
          PermissionCode.PROCESSING_VIEW,
          PermissionCode.ATTENDANCE_VIEW,
          PermissionCode.SHIFT_VIEW,
          PermissionCode.LEAVE_VIEW,
          PermissionCode.LEAVE_CREATE,
          // Phase 06:
          PermissionCode.FINANCE_VIEW,
          PermissionCode.EXPENSE_VIEW,
          PermissionCode.EXPENSE_CREATE,
          PermissionCode.SUPPLIER_VIEW,
          PermissionCode.PURCHASE_VIEW,
          PermissionCode.INVENTORY_VIEW,
          PermissionCode.STOCK_VIEW,
          // Phase 07:
          PermissionCode.PICKUP_VIEW,
          PermissionCode.PICKUP_CREATE,
          PermissionCode.DELIVERY_VIEW,
          PermissionCode.DELIVERY_CREATE,
          // Phase 08:
          PermissionCode.NOTIFICATION_VIEW,
          PermissionCode.NOTIFICATION_SEND,
          PermissionCode.NOTIFICATION_RESEND,
        ];

      case RoleType.OPERATOR:
        return [
          PermissionCode.BRANCH_VIEW,
          PermissionCode.CATEGORY_VIEW,
          PermissionCode.PRODUCT_VIEW,
          PermissionCode.ORDER_VIEW,
          PermissionCode.ORDER_STAGE_UPDATE,
          PermissionCode.PROCESSING_VIEW,
          PermissionCode.PROCESSING_MANAGE,
          PermissionCode.PROCESSING_ISSUE_CREATE,
          PermissionCode.ATTENDANCE_VIEW,
          PermissionCode.SHIFT_VIEW,
          PermissionCode.LEAVE_VIEW,
          PermissionCode.LEAVE_CREATE,
          // Phase 06:
          PermissionCode.INVENTORY_VIEW,
          PermissionCode.STOCK_VIEW,
          // Phase 07:
          PermissionCode.PICKUP_VIEW,
          PermissionCode.DELIVERY_VIEW,
          // Phase 08:
          PermissionCode.NOTIFICATION_VIEW,
        ];

      case RoleType.QC_INSPECTOR:
        return [
          PermissionCode.BRANCH_VIEW,
          PermissionCode.CATEGORY_VIEW,
          PermissionCode.PRODUCT_VIEW,
          PermissionCode.ORDER_VIEW,
          PermissionCode.ORDER_STAGE_UPDATE,
          PermissionCode.PROCESSING_VIEW,
          PermissionCode.PROCESSING_QC,
          PermissionCode.PROCESSING_ISSUE_CREATE,
          PermissionCode.PROCESSING_ISSUE_RESOLVE,
          PermissionCode.ATTENDANCE_VIEW,
          PermissionCode.SHIFT_VIEW,
          PermissionCode.LEAVE_VIEW,
          PermissionCode.LEAVE_CREATE,
          // Phase 06:
          PermissionCode.INVENTORY_VIEW,
          PermissionCode.STOCK_VIEW,
          // Phase 07:
          PermissionCode.PICKUP_VIEW,
          PermissionCode.DELIVERY_VIEW,
        ];

      case RoleType.DELIVERY_AGENT:
        return [
          PermissionCode.BRANCH_VIEW,
          PermissionCode.CUSTOMER_VIEW,
          PermissionCode.ORDER_VIEW,
          PermissionCode.ORDER_STAGE_UPDATE,
          PermissionCode.DELIVERY_VIEW,
          PermissionCode.DELIVERY_UPDATE,
          PermissionCode.PAYMENT_CREATE,
          PermissionCode.ATTENDANCE_VIEW,
          PermissionCode.SHIFT_VIEW,
          PermissionCode.LEAVE_VIEW,
          PermissionCode.LEAVE_CREATE,
          // Phase 06:
          PermissionCode.INVENTORY_VIEW,
          // Phase 07:
          PermissionCode.PICKUP_VIEW,
          PermissionCode.PICKUP_COMPLETE,
          PermissionCode.DELIVERY_COMPLETE,
          PermissionCode.DELIVERY_COLLECTION,
          PermissionCode.DELIVERY_PROOF,
        ];

      default:
        return [PermissionCode.BRANCH_VIEW, PermissionCode.ORDER_VIEW];
    }
  }

  async getOrCreateSystemRole(tenantId: Types.ObjectId, roleCode: RoleType): Promise<RoleDocument> {
    let role = await this.roleModel.findOne({ tenantId, code: roleCode }).exec();
    if (!role) {
      const name = roleCode
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      role = new this.roleModel({
        tenantId,
        code: roleCode,
        name,
        description: `Default system role for ${name}`,
        permissions: this.getDefaultPermissionsForRole(roleCode),
        isSystem: true,
      });
      await role.save();
    }
    return role;
  }

  async createDefaultTenantRoles(tenantId: Types.ObjectId): Promise<Record<string, RoleDocument>> {
    const roles: Record<string, RoleDocument> = {};
    const roleCodes = [
      RoleType.SHOP_OWNER,
      RoleType.BRANCH_MANAGER,
      RoleType.CASHIER,
      RoleType.OPERATOR,
      RoleType.QC_INSPECTOR,
      RoleType.DELIVERY_AGENT,
    ];

    for (const code of roleCodes) {
      roles[code] = await this.getOrCreateSystemRole(tenantId, code);
    }

    return roles;
  }

  async findByTenant(tenantId: Types.ObjectId): Promise<RoleDocument[]> {
    // Ensure default system roles exist
    await this.createDefaultTenantRoles(tenantId);
    return this.roleModel.find({ tenantId }).sort({ isSystem: -1, createdAt: 1 }).exec();
  }

  async findById(id: string | Types.ObjectId): Promise<RoleDocument> {
    return this.roleModel.findById(id).exec();
  }

  async createCustomRole(
    tenantId: Types.ObjectId,
    data: { name: string; description?: string; permissions: string[] },
    actorRole?: string,
    actorPermissions: string[] = [],
  ): Promise<RoleDocument> {
    if (actorRole && actorRole !== RoleType.SHOP_OWNER && actorRole !== RoleType.SUPER_ADMIN) {
      const unauthorized = (data.permissions || []).filter(
        (p) => !actorPermissions.includes(p) && !actorPermissions.includes('*'),
      );
      if (unauthorized.length > 0) {
        throw new ForbiddenException(
          `Privilege escalation rejected: you cannot grant permissions beyond your own authority (${unauthorized.join(', ')})`,
        );
      }
    }

    const code = `CUSTOM_${data.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

    const role = new this.roleModel({
      tenantId,
      name: data.name,
      code,
      description: data.description || `Custom role: ${data.name}`,
      permissions: data.permissions || [],
      isSystem: false,
    });

    return role.save();
  }

  async updateCustomRole(
    id: string,
    tenantId: Types.ObjectId,
    data: { name?: string; description?: string; permissions?: string[] },
    actorRole?: string,
    actorPermissions: string[] = [],
  ): Promise<RoleDocument> {
    const role = await this.roleModel.findOne({ _id: id, tenantId }).exec();
    if (!role) {
      throw new NotFoundException('Role not found or belongs to another tenant');
    }

    if (role.isSystem && role.code === RoleType.SHOP_OWNER) {
      throw new ForbiddenException('Primary Shop Owner role cannot be modified');
    }

    if (data.permissions && actorRole && actorRole !== RoleType.SHOP_OWNER && actorRole !== RoleType.SUPER_ADMIN) {
      const unauthorized = data.permissions.filter(
        (p) => !actorPermissions.includes(p) && !actorPermissions.includes('*'),
      );
      if (unauthorized.length > 0) {
        throw new ForbiddenException(
          `Privilege escalation rejected: you cannot grant permissions beyond your own authority (${unauthorized.join(', ')})`,
        );
      }
    }

    if (data.name) role.name = data.name;
    if (data.description !== undefined) role.description = data.description;
    if (data.permissions) role.permissions = data.permissions;

    return role.save();
  }

  async deleteCustomRole(id: string, tenantId: Types.ObjectId): Promise<{ success: boolean }> {
    const role = await this.roleModel.findOne({ _id: id, tenantId }).exec();
    if (!role) {
      throw new NotFoundException('Role not found or belongs to another tenant');
    }

    if (role.isSystem) {
      throw new ForbiddenException('Built-in system roles cannot be deleted');
    }

    await this.roleModel.deleteOne({ _id: id, tenantId }).exec();
    return { success: true };
  }

  getPermissionCatalog(): Array<{ category: string; permissions: Array<{ code: string; label: string; description: string }> }> {
    return [
      {
        category: 'Orders & POS Counter',
        permissions: [
          { code: PermissionCode.ORDER_VIEW, label: 'View Orders', description: 'View list and status of laundry orders' },
          { code: PermissionCode.ORDER_CREATE, label: 'Create Orders', description: 'Create new intake and counter orders' },
          { code: PermissionCode.ORDER_UPDATE, label: 'Update Orders', description: 'Edit itemization, tags, and notes' },
          { code: PermissionCode.ORDER_CANCEL, label: 'Cancel Orders', description: 'Cancel active customer orders' },
          { code: PermissionCode.ORDER_STAGE_UPDATE, label: 'Update Stage', description: 'Move order between production stages' },
        ],
      },
      {
        category: 'Payments & Billing',
        permissions: [
          { code: PermissionCode.PAYMENT_VIEW, label: 'View Payments', description: 'View transaction history and invoices' },
          { code: PermissionCode.PAYMENT_CREATE, label: 'Collect Payments', description: 'Record cash, card, UPI customer payments' },
          { code: PermissionCode.PAYMENT_REFUND, label: 'Process Refunds', description: 'Issue refunds on completed transactions' },
        ],
      },
      {
        category: 'Customer CRM',
        permissions: [
          { code: PermissionCode.CUSTOMER_VIEW, label: 'View Customers', description: 'Access customer profiles and history' },
          { code: PermissionCode.CUSTOMER_CREATE, label: 'Add Customers', description: 'Register new customers' },
          { code: PermissionCode.CUSTOMER_UPDATE, label: 'Edit Customers', description: 'Update contact details and addresses' },
          { code: PermissionCode.CUSTOMER_NOTES, label: 'Customer Notes', description: 'Manage VIP preferences and notes' },
          { code: PermissionCode.CUSTOMER_EXPORT, label: 'Export Customers', description: 'Download customer contact lists' },
        ],
      },
      {
        category: 'Plant Processing & Quality Control',
        permissions: [
          { code: PermissionCode.PROCESSING_VIEW, label: 'View Queue', description: 'View plant sorting and washing queue' },
          { code: PermissionCode.PROCESSING_MANAGE, label: 'Manage Jobs', description: 'Assign garments to washing/ironing' },
          { code: PermissionCode.PROCESSING_QC, label: 'Perform QC', description: 'Pass or fail garments at QC station' },
          { code: PermissionCode.PROCESSING_ISSUE_CREATE, label: 'Report Issues', description: 'Flag damaged or stained garments' },
        ],
      },
      {
        category: 'Logistics & Dispatch',
        permissions: [
          { code: PermissionCode.PICKUP_VIEW, label: 'View Pickups', description: 'View doorstep pickup requests' },
          { code: PermissionCode.PICKUP_CREATE, label: 'Schedule Pickups', description: 'Book new customer pickups' },
          { code: PermissionCode.DELIVERY_VIEW, label: 'View Deliveries', description: 'View delivery dispatch list' },
          { code: PermissionCode.DELIVERY_DISPATCH, label: 'Dispatch Driver', description: 'Assign driver and dispatch bags' },
          { code: PermissionCode.DELIVERY_COMPLETE, label: 'Complete Delivery', description: 'Record POD and signature' },
        ],
      },
      {
        category: 'Inventory, Expenses & Purchasing',
        permissions: [
          { code: PermissionCode.INVENTORY_VIEW, label: 'View Stock', description: 'View detergents, hangers, packaging stock' },
          { code: PermissionCode.INVENTORY_MANAGE, label: 'Manage Stock', description: 'Stock in, adjustments, and transfers' },
          { code: PermissionCode.EXPENSE_VIEW, label: 'View Expenses', description: 'View store operational expenses' },
          { code: PermissionCode.EXPENSE_CREATE, label: 'Record Expenses', description: 'Log chemical, tea, utility bills' },
          { code: PermissionCode.EXPENSE_APPROVE, label: 'Approve Expenses', description: 'Approve pending store disbursements' },
          { code: PermissionCode.PURCHASE_VIEW, label: 'View Purchases', description: 'View vendor purchase orders' },
          { code: PermissionCode.SUPPLIER_VIEW, label: 'View Suppliers', description: 'View chemical vendor ledgers' },
        ],
      },
      {
        category: 'Staff & Payroll Management',
        permissions: [
          { code: PermissionCode.STAFF_VIEW, label: 'View Staff', description: 'View employee profiles and roles' },
          { code: PermissionCode.STAFF_CREATE, label: 'Add Staff', description: 'Onboard and invite new staff members' },
          { code: PermissionCode.ATTENDANCE_VIEW, label: 'View Attendance', description: 'Check-in/check-out records' },
          { code: PermissionCode.LEAVE_VIEW, label: 'View Leave', description: 'Leave requests and balances' },
          { code: PermissionCode.PAYROLL_VIEW, label: 'View Payroll', description: 'Salary slips and advance ledgers' },
          { code: PermissionCode.PAYROLL_PROCESS, label: 'Process Payroll', description: 'Calculate and disburse monthly wages' },
        ],
      },
      {
        category: 'Reports & Analytics',
        permissions: [
          { code: PermissionCode.REPORT_VIEW, label: 'View Reports', description: 'Sales, garment, and staff analytics' },
          { code: PermissionCode.FINANCE_VIEW, label: 'P&L Dashboard', description: 'Revenue, expenses, profit margin' },
          { code: PermissionCode.REPORT_EXPORT, label: 'Export Reports', description: 'Download CSV spreadsheets' },
        ],
      },
    ];
  }
}
