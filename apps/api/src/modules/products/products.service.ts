import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { Category, CategoryDocument } from '../../schemas/category.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductPriceDto, BranchPriceOverrideDto } from './dto/create-product.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    private auditService: AuditService,
  ) {}

  async findAll(
    tenantId: string | Types.ObjectId,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      categoryId?: string;
      branchId?: string;
      serviceId?: string;
      isActive?: boolean;
    } = {},
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      tenantId: tId,
      isDeleted: false,
    };

    if (query.isActive !== undefined) {
      filter.isActive = String(query.isActive) === 'true';
    }

    if (query.categoryId) {
      filter.categoryId = new Types.ObjectId(query.categoryId);
    }

    if (query.serviceId) {
      filter.serviceIds = new Types.ObjectId(query.serviceId);
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { sku: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.branchId) {
      const bId = new Types.ObjectId(query.branchId);
      // Product must either have empty branchAvailability (available in all) or include bId
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { branchAvailability: { $size: 0 } },
          { branchAvailability: bId },
        ],
      });
    }

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('categoryId', 'name icon color')
        .populate('serviceIds', 'name code multiplier')
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    // Format output with branch pricing override if branchId is requested
    const formattedProducts = products.map((prod) => {
      const obj = prod.toObject();
      let effectivePrices = obj.prices;

      if (query.branchId && obj.branchPriceOverrides && obj.branchPriceOverrides.length > 0) {
        const override = obj.branchPriceOverrides.find(
          (o: any) => o.branchId?.toString() === query.branchId,
        );
        if (override && override.prices) {
          effectivePrices = override.prices;
        }
      }

      return {
        ...obj,
        id: prod._id.toString(),
        categoryName: (prod.categoryId as any)?.name || '',
        category: prod.categoryId,
        services: prod.serviceIds,
        effectivePrices,
      };
    });

    return {
      items: formattedProducts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(
    tenantId: string | Types.ObjectId,
    id: string,
    branchId?: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const product = await this.productModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .populate('categoryId', 'name icon color')
      .populate('serviceIds', 'name code multiplier')
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const obj = product.toObject();
    let effectivePrices = obj.prices;

    if (branchId && obj.branchPriceOverrides && obj.branchPriceOverrides.length > 0) {
      const override = obj.branchPriceOverrides.find(
        (o: any) => o.branchId?.toString() === branchId,
      );
      if (override && override.prices) {
        effectivePrices = override.prices;
      }
    }

    return {
      ...obj,
      id: product._id.toString(),
      categoryName: (product.categoryId as any)?.name || '',
      category: product.categoryId,
      services: product.serviceIds,
      effectivePrices,
    };
  }

  async create(
    tenantId: string | Types.ObjectId,
    actorUserId: string | Types.ObjectId,
    dto: CreateProductDto,
  ): Promise<ProductDocument> {
    const tId = new Types.ObjectId(tenantId.toString());

    // 1. Verify Category exists in this tenant
    const category = await this.categoryModel
      .findOne({ _id: new Types.ObjectId(dto.categoryId), tenantId: tId, isDeleted: false })
      .exec();

    if (!category) {
      throw new BadRequestException('Category not found or does not belong to your organization.');
    }

    // 2. If SKU is provided, check uniqueness within tenant
    if (dto.sku) {
      const existingSku = await this.productModel
        .findOne({ tenantId: tId, sku: dto.sku.toUpperCase(), isDeleted: false })
        .exec();

      if (existingSku) {
        throw new ConflictException(`SKU "${dto.sku}" already exists in your organization.`);
      }
    }

    const serviceObjectIds = (dto.serviceIds || []).map((sId) => new Types.ObjectId(sId));
    const branchAvailabilityIds = (dto.branchAvailability || []).map((bId) => new Types.ObjectId(bId));

    const branchPriceOverrides = (dto.branchPriceOverrides || []).map((override) => ({
      branchId: new Types.ObjectId(override.branchId),
      prices: override.prices,
    }));

    const product = new this.productModel({
      tenantId: tId,
      categoryId: new Types.ObjectId(dto.categoryId),
      serviceIds: serviceObjectIds,
      name: dto.name,
      sku: dto.sku ? dto.sku.toUpperCase() : undefined,
      description: dto.description,
      image: dto.image,
      icon: dto.icon || category.icon || 'Shirt',
      unit: dto.unit,
      prices: dto.prices,
      branchPriceOverrides,
      branchAvailability: branchAvailabilityIds,
      taxRate: dto.taxRate ?? 5.0,
      isTaxable: dto.isTaxable ?? true,
      processingTimeHours: dto.processingTimeHours ?? 24,
      careInstructions: dto.careInstructions,
      sortOrder: dto.sortOrder ?? 0,
      isActive: true,
      isDeleted: false,
    });

    await product.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'PRODUCT_CREATED',
      entity: 'Product',
      entityId: product._id.toString(),
      metadata: { name: product.name, sku: product.sku },
    });

    return product;
  }

  async update(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
    dto: UpdateProductDto,
  ): Promise<ProductDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const product = await this.productModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    if (dto.categoryId) {
      const category = await this.categoryModel
        .findOne({ _id: new Types.ObjectId(dto.categoryId), tenantId: tId, isDeleted: false })
        .exec();
      if (!category) {
        throw new BadRequestException('Category not found in your organization.');
      }
      product.categoryId = new Types.ObjectId(dto.categoryId);
    }

    if (dto.sku && dto.sku.toUpperCase() !== product.sku) {
      const existingSku = await this.productModel
        .findOne({
          tenantId: tId,
          sku: dto.sku.toUpperCase(),
          _id: { $ne: product._id },
          isDeleted: false,
        })
        .exec();
      if (existingSku) {
        throw new ConflictException(`SKU "${dto.sku}" already exists in your organization.`);
      }
      product.sku = dto.sku.toUpperCase();
    }

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.image !== undefined) product.image = dto.image;
    if (dto.icon !== undefined) product.icon = dto.icon;
    if (dto.unit !== undefined) product.unit = dto.unit;
    if (dto.prices !== undefined) product.prices = dto.prices;
    if (dto.taxRate !== undefined) product.taxRate = dto.taxRate;
    if (dto.isTaxable !== undefined) product.isTaxable = dto.isTaxable;
    if (dto.processingTimeHours !== undefined) product.processingTimeHours = dto.processingTimeHours;
    if (dto.careInstructions !== undefined) product.careInstructions = dto.careInstructions;
    if (dto.sortOrder !== undefined) product.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) product.isActive = dto.isActive;

    if (dto.serviceIds !== undefined) {
      product.serviceIds = dto.serviceIds.map((s) => new Types.ObjectId(s));
    }

    if (dto.branchAvailability !== undefined) {
      product.branchAvailability = dto.branchAvailability.map((b) => new Types.ObjectId(b));
    }

    if (dto.branchPriceOverrides !== undefined) {
      product.branchPriceOverrides = dto.branchPriceOverrides.map((override) => ({
        branchId: new Types.ObjectId(override.branchId),
        prices: override.prices,
      }));
    }

    await product.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'PRODUCT_UPDATED',
      entity: 'Product',
      entityId: product._id.toString(),
      metadata: dto,
    });

    return product;
  }

  async updatePricing(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
    prices: ProductPriceDto,
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const product = await this.productModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    product.prices = prices;
    await product.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'PRODUCT_PRICING_UPDATED',
      entity: 'Product',
      entityId: product._id.toString(),
      metadata: { prices },
    });

    return product;
  }

  async updateBranchPriceOverrides(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
    branchPriceOverrides: BranchPriceOverrideDto[],
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const product = await this.productModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    product.branchPriceOverrides = branchPriceOverrides.map((o) => ({
      branchId: new Types.ObjectId(o.branchId),
      prices: o.prices,
    }));

    await product.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'PRODUCT_BRANCH_PRICES_UPDATED',
      entity: 'Product',
      entityId: product._id.toString(),
      metadata: { count: branchPriceOverrides.length },
    });

    return product;
  }

  async delete(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const product = await this.productModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    product.isDeleted = true;
    product.isActive = false;
    product.deletedAt = new Date();
    product.deletedBy = new Types.ObjectId(actorUserId.toString());
    await product.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'PRODUCT_DELETED',
      entity: 'Product',
      entityId: product._id.toString(),
    });

    return { message: 'Product removed successfully' };
  }
}
