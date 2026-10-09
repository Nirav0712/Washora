import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TenantSubscription, TenantSubscriptionDocument } from '../../../schemas/tenant-subscription.schema';
import { Branch, BranchDocument } from '../../../schemas/branch.schema';
import { Membership, MembershipDocument } from '../../../schemas/membership.schema';
import { Customer, CustomerDocument } from '../../../schemas/customer.schema';
import { Order, OrderDocument } from '../../../schemas/order.schema';
import { Product, ProductDocument } from '../../../schemas/product.schema';
import { InventoryItem, InventoryItemDocument } from '../../../schemas/inventory-item.schema';
import { LimitKey, SubscriptionStatus } from '@washora/shared';

@Injectable()
export class UsageLimitService {
  private readonly logger = new Logger(UsageLimitService.name);

  constructor(
    @InjectModel(TenantSubscription.name)
    private subscriptionModel: Model<TenantSubscriptionDocument>,
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
  ) {}

  async getCurrentUsageCount(tenantId: string, limitKey: LimitKey | string): Promise<number> {
    const tenantObjectId = new Types.ObjectId(tenantId);
    switch (limitKey) {
      case LimitKey.MAX_BRANCHES:
        return this.branchModel.countDocuments({ tenantId: tenantObjectId, isActive: true });
      case LimitKey.MAX_STAFF:
      case LimitKey.MAX_USERS:
        return this.membershipModel.countDocuments({ tenantId: tenantObjectId });
      case LimitKey.MAX_CUSTOMERS:
        return this.customerModel.countDocuments({ tenantId: tenantObjectId, isDeleted: { $ne: true } });
      case LimitKey.MAX_MONTHLY_ORDERS: {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        return this.orderModel.countDocuments({ tenantId: tenantObjectId, createdAt: { $gte: startOfMonth } });
      }
      case LimitKey.MAX_PRODUCTS:
        return this.productModel.countDocuments({ tenantId: tenantObjectId, isActive: true });
      case LimitKey.MAX_INVENTORY_ITEMS:
        return this.inventoryModel.countDocuments({ tenantId: tenantObjectId, isActive: { $ne: false } });
      default:
        return 0;
    }
  }

  async getLimit(tenantId: string, limitKey: LimitKey | string): Promise<number> {
    try {
      const sub = await this.subscriptionModel
        .findOne({
          tenantId: new Types.ObjectId(tenantId),
          status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
        })
        .populate('planId')
        .sort({ createdAt: -1 })
        .exec();

      const plan = sub?.planId as any;
      if (!plan || !plan.limits) {
        return 999999;
      }

      return plan.limits[limitKey] ?? 999999;
    } catch {
      return 999999;
    }
  }

  async isWithinLimit(tenantId: string, limitKey: LimitKey | string, increment: number = 1): Promise<boolean> {
    const current = await this.getCurrentUsageCount(tenantId, limitKey);
    const limit = await this.getLimit(tenantId, limitKey);
    return (current + increment) <= limit;
  }

  async assertWithinLimit(tenantId: string, limitKey: LimitKey | string, increment: number = 1): Promise<void> {
    const current = await this.getCurrentUsageCount(tenantId, limitKey);
    const limit = await this.getLimit(tenantId, limitKey);

    if ((current + increment) > limit) {
      throw new BadRequestException(
        `PLAN_LIMIT_EXCEEDED: Resource limit for "${limitKey}" exceeded (${current}/${limit}). Please upgrade your subscription plan to create more resources.`,
      );
    }
  }
}
