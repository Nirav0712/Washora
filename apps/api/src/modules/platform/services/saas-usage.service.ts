import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from '../../../schemas/tenant.schema';
import { Branch, BranchDocument } from '../../../schemas/branch.schema';
import { Membership, MembershipDocument } from '../../../schemas/membership.schema';
import { Customer, CustomerDocument } from '../../../schemas/customer.schema';
import { Order, OrderDocument } from '../../../schemas/order.schema';
import { Product, ProductDocument } from '../../../schemas/product.schema';
import { InventoryItem, InventoryItemDocument } from '../../../schemas/inventory-item.schema';
import { TenantSubscription, TenantSubscriptionDocument } from '../../../schemas/tenant-subscription.schema';
import { TenantUsageSummary, LimitKey } from '@washora/shared';

@Injectable()
export class SaasUsageService {
  private readonly logger = new Logger(SaasUsageService.name);

  constructor(
    @InjectModel(Tenant.name)
    private tenantModel: Model<TenantDocument>,
    @InjectModel(Branch.name)
    private branchModel: Model<BranchDocument>,
    @InjectModel(Membership.name)
    private membershipModel: Model<MembershipDocument>,
    @InjectModel(Customer.name)
    private customerModel: Model<CustomerDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
    @InjectModel(InventoryItem.name)
    private inventoryModel: Model<InventoryItemDocument>,
    @InjectModel(TenantSubscription.name)
    private subscriptionModel: Model<TenantSubscriptionDocument>,
  ) {}

  async getTenantUsage(tenantId: string): Promise<TenantUsageSummary> {
    const tenantObjectId = new Types.ObjectId(tenantId);
    const tenant = await this.tenantModel.findById(tenantObjectId).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const sub = await this.subscriptionModel
      .findOne({ tenantId: tenantObjectId })
      .populate('planId')
      .sort({ createdAt: -1 })
      .exec();

    const plan = sub?.planId as any;
    const limits = plan?.limits || {
      [LimitKey.MAX_BRANCHES]: 1,
      [LimitKey.MAX_STAFF]: 5,
      [LimitKey.MAX_CUSTOMERS]: 500,
      [LimitKey.MAX_MONTHLY_ORDERS]: 300,
      [LimitKey.MAX_USERS]: 3,
      [LimitKey.MAX_PRODUCTS]: 50,
      [LimitKey.MAX_INVENTORY_ITEMS]: 50,
    };

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [branchesCount, staffCount, customersCount, monthlyOrdersCount, productsCount, inventoryCount] = await Promise.all([
      this.branchModel.countDocuments({ tenantId: tenantObjectId, isActive: true }),
      this.membershipModel.countDocuments({ tenantId: tenantObjectId }),
      this.customerModel.countDocuments({ tenantId: tenantObjectId, isDeleted: { $ne: true } }),
      this.orderModel.countDocuments({ tenantId: tenantObjectId, createdAt: { $gte: startOfMonth } }),
      this.productModel.countDocuments({ tenantId: tenantObjectId, isActive: true }),
      this.inventoryModel.countDocuments({ tenantId: tenantObjectId, isActive: { $ne: false } }),
    ]);

    const warnings: string[] = [];

    const calcMetric = (current: number, limit: number, name: string) => {
      const percentage = limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0;
      if (percentage >= 100) {
        warnings.push(`${name} limit reached (100%)`);
      } else if (percentage >= 85) {
        warnings.push(`${name} near limit (${percentage}%)`);
      }
      return { current, limit, percentage };
    };

    const metrics = {
      branches: calcMetric(branchesCount, limits[LimitKey.MAX_BRANCHES] || 1, 'Branch'),
      staff: calcMetric(staffCount, limits[LimitKey.MAX_STAFF] || 5, 'Staff'),
      customers: calcMetric(customersCount, limits[LimitKey.MAX_CUSTOMERS] || 500, 'Customer'),
      monthlyOrders: calcMetric(monthlyOrdersCount, limits[LimitKey.MAX_MONTHLY_ORDERS] || 300, 'Monthly Orders'),
      users: calcMetric(staffCount, limits[LimitKey.MAX_USERS] || 5, 'User'),
      products: calcMetric(productsCount, limits[LimitKey.MAX_PRODUCTS] || 100, 'Product'),
      inventoryItems: calcMetric(inventoryCount, limits[LimitKey.MAX_INVENTORY_ITEMS] || 100, 'Inventory'),
    };

    return {
      tenantId: tenant._id.toString(),
      tenantName: tenant.name,
      planName: plan?.name || 'Standard Plan',
      metrics,
      warnings,
    };
  }

  async getAllTenantsUsageSummary(limit: number = 50) {
    const tenants = await this.tenantModel.find().limit(limit).exec();
    const summaries: TenantUsageSummary[] = [];

    for (const t of tenants) {
      try {
        const u = await this.getTenantUsage(t._id.toString());
        summaries.push(u);
      } catch (err: any) {
        // Skip inaccessible or partially deleted records
      }
    }

    return summaries;
  }
}
