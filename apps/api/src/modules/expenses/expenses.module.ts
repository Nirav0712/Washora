import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Expense, ExpenseSchema } from '../../schemas/expense.schema';
import { ExpenseCategory, ExpenseCategorySchema } from '../../schemas/expense-category.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { Supplier, SupplierSchema } from '../../schemas/supplier.schema';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { CounterModule } from '../../common/services/counter.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: ExpenseCategory.name, schema: ExpenseCategorySchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Supplier.name, schema: SupplierSchema },
    ]),
    CounterModule,
    AuditModule,
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
