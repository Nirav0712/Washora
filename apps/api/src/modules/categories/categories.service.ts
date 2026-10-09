import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../../schemas/category.schema';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private auditService: AuditService,
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async findAll(
    tenantId: string | Types.ObjectId,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      branchId?: string;
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

    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }

    if (query.branchId) {
      const bId = new Types.ObjectId(query.branchId);
      filter.$or = [
        { branchIds: { $size: 0 } },
        { branchIds: bId },
        { branchId: bId },
        { branchId: null },
      ];
    }

    const [categories, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.categoryModel.countDocuments(filter),
    ]);

    // Attach dynamic product count per category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await this.productModel.countDocuments({
          tenantId: tId,
          categoryId: cat._id,
          isDeleted: false,
        });
        const obj = cat.toObject();
        return {
          ...obj,
          id: cat._id.toString(),
          productCount,
        };
      }),
    );

    return {
      items: categoriesWithCount,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(tenantId: string | Types.ObjectId, id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const category = await this.categoryModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    const productCount = await this.productModel.countDocuments({
      tenantId: tId,
      categoryId: category._id,
      isDeleted: false,
    });

    const obj = category.toObject();
    return {
      ...obj,
      id: category._id.toString(),
      productCount,
    };
  }

  async create(
    tenantId: string | Types.ObjectId,
    actorUserId: string | Types.ObjectId,
    dto: CreateCategoryDto,
  ): Promise<CategoryDocument> {
    const tId = new Types.ObjectId(tenantId.toString());

    const category = new this.categoryModel({
      tenantId: tId,
      name: dto.name,
      slug: this.slugify(dto.name),
      description: dto.description,
      icon: dto.icon || 'Shirt',
      color: dto.color || '#3B82F6',
      image: dto.image,
      sortOrder: dto.sortOrder ?? 0,
      branchIds: (dto.branchIds || []).map((id) => new Types.ObjectId(id)),
      isActive: true,
      isDeleted: false,
    });

    await category.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'CATEGORY_CREATED',
      entity: 'Category',
      entityId: category._id.toString(),
      metadata: { name: category.name },
    });

    return category;
  }

  async update(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
    dto: UpdateCategoryDto,
  ): Promise<CategoryDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const category = await this.categoryModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    if (dto.name !== undefined) {
      category.name = dto.name;
      category.slug = this.slugify(dto.name);
    }
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.icon !== undefined) category.icon = dto.icon;
    if (dto.color !== undefined) category.color = dto.color;
    if (dto.image !== undefined) category.image = dto.image;
    if (dto.sortOrder !== undefined) category.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;
    if (dto.branchIds !== undefined) {
      category.branchIds = dto.branchIds.map((bid) => new Types.ObjectId(bid));
    }

    await category.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'CATEGORY_UPDATED',
      entity: 'Category',
      entityId: category._id.toString(),
      metadata: dto,
    });

    return category;
  }

  async delete(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const catId = new Types.ObjectId(id);

    const category = await this.categoryModel
      .findOne({ _id: catId, tenantId: tId, isDeleted: false })
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    // Check if products exist in this category
    const activeProducts = await this.productModel.countDocuments({
      tenantId: tId,
      categoryId: catId,
      isDeleted: false,
    });

    if (activeProducts > 0) {
      // Safe archival / disable rather than destructive deletion
      category.isActive = false;
      category.isDeleted = true;
      category.deletedAt = new Date();
      category.deletedBy = new Types.ObjectId(actorUserId.toString());
      await category.save();

      await this.auditService.log({
        tenantId: tId,
        actorUserId,
        action: 'CATEGORY_ARCHIVED_WITH_PRODUCTS',
        entity: 'Category',
        entityId: category._id.toString(),
        metadata: { productCount: activeProducts },
      });

      return {
        message: `Category has ${activeProducts} linked product(s) and was safely archived.`,
      };
    }

    category.isDeleted = true;
    category.isActive = false;
    category.deletedAt = new Date();
    category.deletedBy = new Types.ObjectId(actorUserId.toString());
    await category.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'CATEGORY_DELETED',
      entity: 'Category',
      entityId: category._id.toString(),
    });

    return { message: 'Category removed successfully' };
  }
}
