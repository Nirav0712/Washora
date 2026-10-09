import { apiClient } from './client';
import {
  LogisticsDashboard,
  DeliveryAgentSummary,
  PickupRequest,
  DeliveryRequest,
  ApiResponse,
} from '@washora/shared';

export const logisticsApi = {
  getDashboard: (params?: { branchId?: string } | string) => {
    const bId = typeof params === 'string' ? params : params?.branchId;
    return apiClient.get<ApiResponse<LogisticsDashboard>>('/logistics/dashboard', {
      params: bId ? { branchId: bId } : undefined,
    });
  },

  getAgents: (params?: { branchId?: string } | string) => {
    const bId = typeof params === 'string' ? params : params?.branchId;
    return apiClient.get<ApiResponse<DeliveryAgentSummary[]>>('/logistics/agents', {
      params: bId ? { branchId: bId } : undefined,
    });
  },

  getMyJobs: (date?: string) =>
    apiClient.get<
      ApiResponse<{
        agent: any;
        pickups: PickupRequest[];
        deliveries: DeliveryRequest[];
        summary: {
          totalJobs: number;
          completedJobs: number;
          pendingJobs: number;
          cashCollected: number;
        };
      }>
    >('/logistics/my-jobs', {
      params: date ? { date } : undefined,
    }),
};
