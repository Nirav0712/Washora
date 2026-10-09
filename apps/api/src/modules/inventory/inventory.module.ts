import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryItem, InventoryItemSchema } from '../../schemas/inventory-item.schema';
import { InventoryCategory, InventoryCategorySchema } from '../../schemas/inventory-category.schema';
import { StockMovement, StockMovementSchema } from '../../schemas/stock-movement.schema';
import { InventoryTransfer, InventoryTransferSchema } from '../../schemas/inventory-transfer.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryStockService } from './inventory-stock.service';
import { CounterModule } from '../../common/services/counter.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: InventoryCategory.name, schema: InventoryCategorySchema },
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: InventoryTransfer.name, schema: InventoryTransferSchema },
      { name: Branch.name, schema: BranchSchema },
    ]),
    CounterModule,
    AuditModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryStockService],
  exports: [InventoryService, InventoryStockService],
})
export class InventoryModule {}
