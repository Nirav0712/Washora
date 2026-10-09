import { apiClient } from './client';
import { GarmentCondition, GarmentProcessingStatus, ProcessingStage } from '@washora/shared';

export interface CreateGarmentInput {
  productId: string;
  serviceId?: string;
  productName?: string;
  serviceName?: string;
  garmentType?: string;
  quantity?: number;
  color?: string;
  brand?: string;
  condition?: GarmentCondition;
  conditionNotes?: string;
  stainsNoted?: string[];
  damagesNoted?: string[];
  specialInstructions?: string;
  shelfLocation?: string;
}

export interface UpdateGarmentInput {
  color?: string;
  brand?: string;
  condition?: GarmentCondition;
  conditionNotes?: string;
  stainsNoted?: string[];
  damagesNoted?: string[];
  specialInstructions?: string;
  processingStatus?: GarmentProcessingStatus;
  stage?: ProcessingStage;
  isQCApproved?: boolean;
  shelfLocation?: string;
}

export const garmentsApi = {
  getById: (id: string) => {
    return apiClient.get<any>(`/garments/${id}`);
  },

  getByOrder: (orderId: string) => {
    return apiClient.get<any[]>(`/orders/${orderId}/garments`);
  },

  addToOrder: (orderId: string, data: CreateGarmentInput) => {
    return apiClient.post<any>(`/orders/${orderId}/garments`, data);
  },

  update: (id: string, data: UpdateGarmentInput) => {
    return apiClient.patch<any>(`/garments/${id}`, data);
  },
};
