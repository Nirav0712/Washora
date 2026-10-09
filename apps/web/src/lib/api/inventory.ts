import { apiClient } from './client';
import {
  InventoryItem,
  InventoryCategory,
  StockMovement,
  InventoryTransfer,
  InventoryUnit,
  StockMovementType,
  TransferStatus,
} from '@washora/shared';

export interface CreateInventoryCategoryPayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateInventoryItemPayload {
  branchId?: string;
  categoryId: string;
  name: string;
  description?: string;
  unit: InventoryUnit;
  initialStock?: number;
  minimumStock?: number;
  reorderLevel?: number;
  unitCost?: number;
  isActive?: boolean;
}

export interface StockAdjustmentPayload {
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
}

export interface RequestInventoryTransferPayload {
  fromBranchId: string;
  toBranchId: string;
  inventoryItemId: string;
  quantity: number;
  notes?: string;
}

export interface InventoryItemListParams {
  branchId?: string;
  categoryId?: string;
  search?: string;
  lowStockOnly?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const inventoryApi = {
  // Categories
  getCategories: () =>
    apiClient.get<InventoryCategory[]>('/inventory/categories'),

  createCategory: (data: CreateInventoryCategoryPayload) =>
    apiClient.post<InventoryCategory>('/inventory/categories', data),

  updateCategory: (id: string, data: Partial<CreateInventoryCategoryPayload>) =>
    apiClient.put<InventoryCategory>(`/inventory/categories/${id}`, data),

  // Items
  getItems: (params?: InventoryItemListParams) =>
    apiClient.get<{ data: InventoryItem[]; total: number; page: number; limit: number; totalPages: number }>('/inventory/items', { params }),

  getItemById: (id: string) =>
    apiClient.get<InventoryItem>(`/inventory/items/${id}`),

  createItem: (data: CreateInventoryItemPayload) =>
    apiClient.post<InventoryItem>('/inventory/items', data),

  updateItem: (id: string, data: Partial<CreateInventoryItemPayload>) =>
    apiClient.put<InventoryItem>(`/inventory/items/${id}`, data),

  deleteItem: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/inventory/items/${id}`),

  // Adjustments & Movements
  adjustStock: (data: StockAdjustmentPayload) =>
    apiClient.post<{ item: InventoryItem; movement: StockMovement }>('/inventory/adjustments', data),

  getStockMovements: (params?: { inventoryItemId?: string; branchId?: string; type?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    apiClient.get<{ data: StockMovement[]; total: number; page: number; limit: number; totalPages: number }>('/inventory/movements', { params }),

  // Transfers
  getTransfers: (params?: { fromBranchId?: string; toBranchId?: string; status?: TransferStatus; page?: number; limit?: number }) =>
    apiClient.get<{ data: InventoryTransfer[]; total: number; page: number; limit: number; totalPages: number }>('/inventory/transfers', { params }),

  requestTransfer: (data: RequestInventoryTransferPayload) =>
    apiClient.post<InventoryTransfer>('/inventory/transfers', data),

  completeTransfer: (id: string, data?: { notes?: string }) =>
    apiClient.post<InventoryTransfer>(`/inventory/transfers/${id}/complete`, data || {}),

  cancelTransfer: (id: string) =>
    apiClient.post<InventoryTransfer>(`/inventory/transfers/${id}/cancel`),

  // Valuation
  getValuation: (branchId?: string) =>
    apiClient.get<any>('/inventory/valuation', { params: { branchId } }),
};
