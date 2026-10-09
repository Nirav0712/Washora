import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Purchase, PurchaseSchema } from '../../schemas/purchase.schema';
import { PurchaseItem, PurchaseItemSchema } from '../../schemas/purchase-item.schema';
import { Supplier, SupplierSchema } from '../../schemas/supplier.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { InventoryItem, InventoryItemSchema } from '../../schemas/inventory-item.schema';
import { SupplierPayment, SupplierPaymentSchema } from '../../schemas/supplier-payment.schema';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { InventoryModule } from '../inventory/inventory.module';
import { CounterModule } from '../../common/services/counter.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Purchase.name, schema: PurchaseSchema },
      { name: PurchaseItem.name, schema: PurchaseItemSchema },
      { name: Supplier.name, schema: SupplierSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: SupplierPayment.name, schema: SupplierPaymentSchema },
    ]),
    InventoryModule,
    CounterModule,
    AuditModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
