import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { Category, CategoryDocument } from '../../schemas/category.schema';
import { Service, ServiceDocument } from '../../schemas/service.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { PricingTier, DiscountType, PaymentStatus, OrderStatus } from '@washora/shared';

export interface ResolvedItemPrice {
  productId: Types.ObjectId;
  categoryId?: Types.ObjectId;
  serviceId?: Types.ObjectId;
  productNameSnapshot: string;
  categoryNameSnapshot?: string;
  serviceNameSnapshot?: string;
  unit: string;
  pricingTier: PricingTier;
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  lineTotal: number;
  notes?: string;
  garmentColor?: string;
  garmentBrand?: string;
  defectsNoted?: string[];
}

@Injectable()
export class PricingCalculatorService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
  ) {}

  async resolveProductPrice(
    tenantId: Types.ObjectId,
    branchId: Types.ObjectId,
    productId: string | Types.ObjectId,
    serviceId?: string | Types.ObjectId,
    tier: PricingTier = PricingTier.REGULAR,
  ) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException(`Invalid product ID: ${productId}`);
    }

    const product = await this.productModel
      .findOne({ _id: new Types.ObjectId(productId), tenantId, isDeleted: false })
      .populate('categoryId', 'name')
      .populate('serviceIds', 'name multiplier')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found in your organization.`);
    }

    if (!product.isActive) {
      throw new BadRequestException(`Product "${product.name}" is currently inactive.`);
    }

    // Check branch availability
    if (product.branchAvailability && product.branchAvailability.length > 0) {
      const isAvailableInBranch = product.branchAvailability.some(
        (bId) => bId.toString() === branchId.toString(),
      );
      if (!isAvailableInBranch) {
        throw new BadRequestException(
          `Product "${product.name}" is not available at the selected branch.`,
        );
      }
    }

    // 1. Resolve Tiered Price (check branch override first)
    let basePrice = 0;
    let effectivePrices = product.prices;

    if (product.branchPriceOverrides && product.branchPriceOverrides.length > 0) {
      const override = product.branchPriceOverrides.find(
        (o) => o.branchId.toString() === branchId.toString(),
      );
      if (override && override.prices) {
        effectivePrices = override.prices;
      }
    }

    switch (tier) {
      case PricingTier.EXPRESS:
        basePrice = effectivePrices.express || product.prices.express || product.prices.regular;
        break;
      case PricingTier.SAME_DAY:
        basePrice = effectivePrices.sameDay || product.prices.sameDay || product.prices.regular;
        break;
      case PricingTier.URGENT:
        basePrice = effectivePrices.urgent || product.prices.urgent || product.prices.sameDay || product.prices.regular;
        break;
      case PricingTier.CUSTOM:
        basePrice = effectivePrices.custom || product.prices.custom || product.prices.regular;
        break;
      case PricingTier.REGULAR:
      default:
        basePrice = effectivePrices.regular || product.prices.regular;
        break;
    }

    // 2. Service Multiplier if serviceId is supplied
    let serviceNameSnapshot: string | undefined;
    let multiplier = 1.0;

    if (serviceId && Types.ObjectId.isValid(serviceId)) {
      const service = await this.serviceModel
        .findOne({ _id: new Types.ObjectId(serviceId), tenantId, isDeleted: false })
        .exec();
      if (service) {
        serviceNameSnapshot = service.name;
        if (service.multiplier && service.multiplier > 0) {
          multiplier = service.multiplier;
        }
      }
    }

    const unitPrice = Math.round(basePrice * multiplier * 100) / 100;

    return {
      product,
      productNameSnapshot: product.name,
      categoryNameSnapshot: (product.categoryId as any)?.name || 'General Care',
      serviceNameSnapshot,
      unitPrice,
      taxRate: product.taxRate ?? 5.0,
      unit: product.unit,
    };
  }

  calculateOrderTotals(
    items: ResolvedItemPrice[],
    discountInput: { type?: DiscountType; value?: number } = {},
    tenantTaxRate = 5.0,
    paidAmount = 0,
  ) {
    let subtotal = 0;
    let itemCount = 0;

    for (const item of items) {
      item.lineSubtotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
      subtotal += item.lineSubtotal;
      itemCount += item.quantity;
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // Discount
    let discountAmount = 0;
    const discountType = discountInput.type || DiscountType.AMOUNT;
    const discountValue = Math.max(0, discountInput.value || 0);

    if (discountType === DiscountType.PERCENTAGE) {
      const pct = Math.min(100, discountValue);
      discountAmount = Math.round(((subtotal * pct) / 100) * 100) / 100;
    } else {
      discountAmount = Math.min(subtotal, Math.round(discountValue * 100) / 100);
    }

    const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

    // Tax calculation on taxableAmount
    const taxRate = Math.max(0, tenantTaxRate);
    const taxAmount = Math.round(((taxableAmount * taxRate) / 100) * 100) / 100;

    const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;
    const cleanPaidAmount = Math.max(0, Math.round(paidAmount * 100) / 100);
    const dueAmount = Math.max(0, Math.round((grandTotal - cleanPaidAmount) * 100) / 100);

    let paymentStatus = PaymentStatus.UNPAID;
    if (cleanPaidAmount >= grandTotal && grandTotal > 0) {
      paymentStatus = PaymentStatus.PAID;
    } else if (cleanPaidAmount > 0) {
      paymentStatus = PaymentStatus.PARTIALLY_PAID;
    }

    return {
      itemCount,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxableAmount,
      taxRate,
      taxAmount,
      grandTotal,
      paidAmount: cleanPaidAmount,
      dueAmount,
      paymentStatus,
    };
  }

  validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus) {
    if (currentStatus === newStatus) return true;

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.DRAFT]: [OrderStatus.RECEIVED, OrderStatus.CANCELLED],
      [OrderStatus.RECEIVED]: [OrderStatus.PROCESSING, OrderStatus.TAGGED, OrderStatus.CANCELLED],
      [OrderStatus.TAGGED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.SORTING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.QC, OrderStatus.PACKED, OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.QC]: [OrderStatus.PACKED, OrderStatus.READY, OrderStatus.PROCESSING],
      [OrderStatus.PACKED]: [OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY],
      [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.COMPLETED],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.READY, OrderStatus.COMPLETED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const validNextStates = allowedTransitions[currentStatus] || [];
    if (!validNextStates.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid order status transition from "${currentStatus}" to "${newStatus}".`,
      );
    }
    return true;
  }
}
