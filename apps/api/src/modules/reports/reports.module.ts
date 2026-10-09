import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';
import { ReportsQueryService } from './services/reports-query.service';
import { ReportsExportService } from './services/reports-export.service';

import { Order, OrderSchema } from '../../schemas/order.schema';
import { Payment, PaymentSchema } from '../../schemas/payment.schema';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { Expense, ExpenseSchema } from '../../schemas/expense.schema';
import { InventoryItem, InventoryItemSchema } from '../../schemas/inventory-item.schema';
import { StockMovement, StockMovementSchema } from '../../schemas/stock-movement.schema';
import { Supplier, SupplierSchema } from '../../schemas/supplier.schema';
import { Purchase, PurchaseSchema } from '../../schemas/purchase.schema';
import { ProcessingJob, ProcessingJobSchema } from '../../schemas/processing-job.schema';
import { QualityCheck, QualityCheckSchema } from '../../schemas/quality-check.schema';
import { AttendanceRecord, AttendanceRecordSchema } from '../../schemas/attendance-record.schema';
import { PickupRequest, PickupRequestSchema } from '../../schemas/pickup-request.schema';
import { DeliveryRequest, DeliveryRequestSchema } from '../../schemas/delivery-request.schema';
import { Notification, NotificationSchema } from '../../schemas/notification.schema';
import { PayrollRecord, PayrollRecordSchema } from '../../schemas/payroll-record.schema';
import { Membership, MembershipSchema } from '../../schemas/membership.schema';
import { Category, CategorySchema } from '../../schemas/category.schema';
import { Product, ProductSchema } from '../../schemas/product.schema';
import { Service, ServiceSchema } from '../../schemas/service.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: Supplier.name, schema: SupplierSchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: ProcessingJob.name, schema: ProcessingJobSchema },
      { name: QualityCheck.name, schema: QualityCheckSchema },
      { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
      { name: PickupRequest.name, schema: PickupRequestSchema },
      { name: DeliveryRequest.name, schema: DeliveryRequestSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: PayrollRecord.name, schema: PayrollRecordSchema },
      { name: Membership.name, schema: MembershipSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsQueryService, ReportsExportService],
  exports: [ReportsService, ReportsQueryService, ReportsExportService],
})
export class ReportsModule {}
