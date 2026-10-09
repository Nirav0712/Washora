import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Supplier, SupplierSchema } from '../../schemas/supplier.schema';
import { SupplierPayment, SupplierPaymentSchema } from '../../schemas/supplier-payment.schema';
import { Purchase, PurchaseSchema } from '../../schemas/purchase.schema';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { CounterModule } from '../../common/services/counter.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Supplier.name, schema: SupplierSchema },
      { name: SupplierPayment.name, schema: SupplierPaymentSchema },
      { name: Purchase.name, schema: PurchaseSchema },
    ]),
    CounterModule,
    AuditModule,
  ],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
