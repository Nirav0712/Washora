import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from '../../schemas/tenant.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { Category, CategoryDocument } from '../../schemas/category.schema';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { Customer, CustomerDocument } from '../../schemas/customer.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  UnitType,
  ServiceTier,
} from '@washora/shared';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async seedAll(): Promise<{ message: string; counts: Record<string, number> }> {
    this.logger.log('🌱 Starting MongoDB Atlas database seeding for Washora...');

    // 1. Create or Find Tenant
    let tenant = await this.tenantModel.findOne({ slug: 'cleanwave' });
    if (!tenant) {
      tenant = await this.tenantModel.create({
        name: 'CleanWave Care & Dry Cleaners',
        slug: 'cleanwave',
        plan: 'PROFESSIONAL',
        phone: '9876543210',
        email: 'hello@cleanwavecare.com',
        currency: 'INR',
        currencySymbol: '₹',
        taxRegistrationNumber: '29ABCDE1234F1Z5',
        isActive: true,
      });
      this.logger.log(`Created Tenant: ${tenant.name}`);
    }

    const tenantId = (tenant as any)._id;

    // 2. Seed Branches
    const branchesData = [
      {
        tenantId,
        name: 'Indiranagar Flagship Hub',
        code: 'IND-01',
        address: '100ft Road, HAL 2nd Stage, Indiranagar',
        city: 'Bengaluru',
        pincode: '560038',
        phone: '080-25251122',
        email: 'indiranagar@cleanwavecare.com',
        isActive: true,
        isMainHub: true,
        taxRate: 5,
      },
      {
        tenantId,
        name: 'Koramangala Express Counter',
        code: 'KOR-02',
        address: '80ft Road, 4th Block, Koramangala',
        city: 'Bengaluru',
        pincode: '560034',
        phone: '080-41412233',
        email: 'koramangala@cleanwavecare.com',
        isActive: true,
        isMainHub: false,
        taxRate: 5,
      },
      {
        tenantId,
        name: 'Whitefield Central Plant',
        code: 'WTF-03',
        address: 'ECC Road, Palm Meadows, Whitefield',
        city: 'Bengaluru',
        pincode: '560066',
        phone: '080-67678899',
        email: 'whitefield@cleanwavecare.com',
        isActive: true,
        isMainHub: false,
        taxRate: 5,
      },
    ];

    const branchDocs: any[] = [];
    for (const b of branchesData) {
      let branch = await this.branchModel.findOne({ tenantId, code: b.code });
      if (!branch) {
        branch = await this.branchModel.create(b);
      }
      branchDocs.push(branch);
    }

    const mainBranchId = branchDocs[0]._id;

    // 3. Seed Categories
    const categoriesData = [
      {
        tenantId,
        name: 'Dry Cleaning',
        icon: '👔',
        slug: 'dry-cleaning',
        description: 'Specialized chemical solvent cleaning for delicate and tailored garments',
        displayOrder: 1,
        productCount: 4,
      },
      {
        tenantId,
        name: 'Wash & Fold',
        icon: '🧺',
        slug: 'wash-and-fold',
        description: 'Everyday laundry washed with premium detergent, dried and folded',
        displayOrder: 2,
        productCount: 2,
      },
      {
        tenantId,
        name: 'Steam Ironing',
        icon: '💨',
        slug: 'steam-ironing',
        description: 'Crisp industrial steam pressing for shirts, trousers and ethnic wear',
        displayOrder: 3,
        productCount: 1,
      },
      {
        tenantId,
        name: 'Shoe Spa',
        icon: '👟',
        slug: 'shoe-spa',
        description: 'Deep cleaning and restoration for sneakers & leather',
        displayOrder: 4,
        productCount: 1,
      },
      {
        tenantId,
        name: 'Curtains & Bedding',
        icon: '🛏️',
        slug: 'curtains-bedding',
        description: 'Heavy duty cleaning for bedsheets, quilts, comforters and drapes',
        displayOrder: 5,
        productCount: 2,
      },
      {
        tenantId,
        name: 'Premium Saree Care',
        icon: '✨',
        slug: 'saree-care',
        description: 'Roll polishing, charak, petrol wash for silk and zari sarees',
        displayOrder: 6,
        productCount: 1,
      },
    ];

    const categoryDocs: Record<string, any> = {};
    for (const c of categoriesData) {
      let cat = await this.categoryModel.findOne({ tenantId, slug: c.slug });
      if (!cat) {
        cat = await this.categoryModel.create(c);
      }
      categoryDocs[c.slug] = cat;
    }

    // 4. Seed Products
    const productsData = [
      {
        tenantId,
        categoryId: categoryDocs['dry-cleaning']?._id,
        categoryName: 'Dry Cleaning',
        name: 'Men Shirt',
        sku: 'DC-SHIRT-M',
        unit: UnitType.PIECE,
        prices: { regular: 60, express: 90, sameDay: 120 },
        taxPercent: 5,
        processingTimeHours: 48,
        icon: '👔',
        branchAvailability: branchDocs.map((b) => b._id),
      },
      {
        tenantId,
        categoryId: categoryDocs['dry-cleaning']?._id,
        categoryName: 'Dry Cleaning',
        name: 'Trouser / Pant',
        sku: 'DC-TROUSER',
        unit: UnitType.PIECE,
        prices: { regular: 70, express: 100, sameDay: 140 },
        taxPercent: 5,
        processingTimeHours: 48,
        icon: '👖',
        branchAvailability: branchDocs.map((b) => b._id),
      },
      {
        tenantId,
        categoryId: categoryDocs['dry-cleaning']?._id,
        categoryName: 'Dry Cleaning',
        name: 'Blazer / Coat',
        sku: 'DC-BLAZER-2PC',
        unit: UnitType.PIECE,
        prices: { regular: 250, express: 350, sameDay: 450 },
        taxPercent: 5,
        processingTimeHours: 72,
        icon: '🧥',
        branchAvailability: branchDocs.map((b) => b._id),
      },
      {
        tenantId,
        categoryId: categoryDocs['saree-care']?._id,
        categoryName: 'Premium Saree Care',
        name: 'Silk Saree',
        sku: 'DC-SAREE-SILK',
        unit: UnitType.PIECE,
        prices: { regular: 150, express: 220, sameDay: 300 },
        taxPercent: 5,
        processingTimeHours: 72,
        icon: '🥻',
        branchAvailability: branchDocs.map((b) => b._id),
      },
      {
        tenantId,
        categoryId: categoryDocs['curtains-bedding']?._id,
        categoryName: 'Curtains & Bedding',
        name: 'Double Blanket / Quilt',
        sku: 'BED-BLANKET-DBL',
        unit: UnitType.PIECE,
        prices: { regular: 200, express: 300, sameDay: 400 },
        taxPercent: 5,
        processingTimeHours: 48,
        icon: '🛌',
        branchAvailability: branchDocs.map((b) => b._id),
      },
      {
        tenantId,
        categoryId: categoryDocs['curtains-bedding']?._id,
        categoryName: 'Curtains & Bedding',
        name: 'Window Curtain',
        sku: 'CURTAIN-MTR',
        unit: UnitType.PIECE,
        prices: { regular: 100, express: 150, sameDay: 200 },
        taxPercent: 5,
        processingTimeHours: 48,
        icon: '🪟',
        branchAvailability: branchDocs.map((b) => b._id),
      },
      {
        tenantId,
        categoryId: categoryDocs['wash-and-fold']?._id,
        categoryName: 'Wash & Fold',
        name: 'Everyday Mixed Wear',
        sku: 'WF-KG-STD',
        unit: UnitType.KG,
        prices: { regular: 80, express: 120, sameDay: 160 },
        taxPercent: 5,
        processingTimeHours: 24,
        icon: '🧺',
        branchAvailability: branchDocs.map((b) => b._id),
      },
      {
        tenantId,
        categoryId: categoryDocs['shoe-spa']?._id,
        categoryName: 'Shoe Spa',
        name: 'Sneakers / Sports Shoes',
        sku: 'SHOE-SNEAKER',
        unit: UnitType.PAIR,
        prices: { regular: 300, express: 450, sameDay: 600 },
        taxPercent: 18,
        processingTimeHours: 48,
        icon: '👟',
        branchAvailability: branchDocs.map((b) => b._id),
      },
    ];

    for (const p of productsData) {
      const exists = await this.productModel.findOne({ tenantId, name: p.name });
      if (!exists) {
        await this.productModel.create(p);
      }
    }

    // 5. Seed Customers
    const customersData = [
      {
        tenantId,
        name: 'Rahul Patel',
        phone: '9876543210',
        email: 'rahul.patel@example.com',
        address: 'Flat 402, Sunshine Heights, 100ft Road, Indiranagar',
        city: 'Bengaluru',
        pincode: '560038',
        totalOrders: 14,
        totalSpent: 12450,
        pendingBalance: 89,
        isVIP: true,
        tags: ['VIP', 'Express Regular'],
      },
      {
        tenantId,
        name: 'Priya Sharma',
        phone: '9845011223',
        email: 'priya.sharma@example.com',
        address: 'Villa 12, Palm Meadows, Whitefield',
        city: 'Bengaluru',
        pincode: '560066',
        totalOrders: 22,
        totalSpent: 28900,
        pendingBalance: 0,
        isVIP: true,
        tags: ['Silk Saree Care', 'Weekly Pickup'],
      },
      {
        tenantId,
        name: 'Amitabh Sen',
        phone: '9711233445',
        email: 'amitabh.sen@techcorp.io',
        address: 'Tower B - 901, Prestige Ferns, Koramangala',
        city: 'Bengaluru',
        pincode: '560034',
        totalOrders: 8,
        totalSpent: 6420,
        pendingBalance: 0,
        tags: ['Corporate'],
      },
    ];

    const customerDocs: Record<string, any> = {};
    for (const c of customersData) {
      let cust = await this.customerModel.findOne({ tenantId, phone: c.phone });
      if (!cust) {
        cust = await this.customerModel.create(c);
      }
      customerDocs[c.phone] = cust;
    }

    // 6. Seed Sample Orders
    const sampleOrder = await this.orderModel.findOne({ orderNumber: '#ORD-10251' });
    if (!sampleOrder) {
      await this.orderModel.create({
        orderNumber: '#ORD-10251',
        tenantId,
        branchId: mainBranchId,
        branchName: branchDocs[0].name,
        customerId: customerDocs['9876543210']?._id,
        customer: {
          name: 'Rahul Patel',
          phone: '9876543210',
          email: 'rahul.patel@example.com',
          address: 'Flat 402, Sunshine Heights, Indiranagar',
        },
        items: [
          {
            id: 'item-1',
            productName: 'Men Shirt',
            categoryName: 'Dry Cleaning',
            unit: UnitType.PIECE,
            tier: ServiceTier.REGULAR,
            unitPrice: 60,
            quantity: 2,
            subtotal: 120,
            garmentColor: 'Sky Blue, White Stripe',
            garmentBrand: 'Raymond',
            barcode: 'BC-10251-1',
          },
          {
            id: 'item-2',
            productName: 'Trouser / Pant',
            categoryName: 'Dry Cleaning',
            unit: UnitType.PIECE,
            tier: ServiceTier.REGULAR,
            unitPrice: 70,
            quantity: 1,
            subtotal: 70,
            garmentColor: 'Charcoal Grey',
            garmentBrand: 'Van Heusen',
            barcode: 'BC-10251-2',
          },
        ],
        itemCount: 3,
        subtotal: 190,
        discount: 10,
        tax: 9,
        taxRate: 5,
        total: 189,
        paidAmount: 100,
        dueAmount: 89,
        paymentStatus: PaymentStatus.PARTIAL,
        paymentMethod: PaymentMethod.UPI,
        orderStatus: OrderStatus.READY,
        timeline: [
          {
            status: OrderStatus.RECEIVED,
            label: 'Order received & garment tagged',
            timestamp: new Date().toISOString(),
            updatedBy: 'Ramesh (Counter)',
            isCompleted: true,
          },
          {
            status: OrderStatus.PROCESSING,
            label: 'Dry clean solvent cycle active',
            timestamp: new Date().toISOString(),
            updatedBy: 'Suresh (Plant Operator)',
            isCompleted: true,
          },
          {
            status: OrderStatus.QC,
            label: 'Quality check passed & pressed',
            timestamp: new Date().toISOString(),
            updatedBy: 'Manoj (QC Lead)',
            isCompleted: true,
          },
          {
            status: OrderStatus.READY,
            label: 'Ready for customer pickup',
            timestamp: new Date().toISOString(),
            updatedBy: 'Ramesh (Counter)',
            isCompleted: true,
          },
        ],
        expectedDeliveryDate: new Date(Date.now() + 24 * 3600 * 1000),
        notes: 'Please ensure crisp crease on charcoal trouser',
        tags: ['Regular Pickup', 'Partial Paid'],
        express: false,
      });
    }

    const counts = {
      tenants: await this.tenantModel.countDocuments(),
      branches: await this.branchModel.countDocuments(),
      categories: await this.categoryModel.countDocuments(),
      products: await this.productModel.countDocuments(),
      customers: await this.customerModel.countDocuments(),
      orders: await this.orderModel.countDocuments(),
    };

    this.logger.log(`✅ Seeding complete: ${JSON.stringify(counts)}`);
    return {
      message: 'Database seeded successfully on MongoDB Atlas cluster!',
      counts,
    };
  }
}
