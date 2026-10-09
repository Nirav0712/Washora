import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from '../../schemas/payment.schema';
import { Expense, ExpenseSchema } from '../../schemas/expense.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Supplier, SupplierSchema } from '../../schemas/supplier.schema';
import { Purchase, PurchaseSchema } from '../../schemas/purchase.schema';
import { InventoryItem, InventoryItemSchema } from '../../schemas/inventory-item.schema';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Supplier.name, schema: SupplierSchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: InventoryItem.name, schema: InventoryItemSchema },
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
