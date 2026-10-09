// Public & Customer Order Tracking API Client

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface PublicOrderTracking {
  tenantName: string;
  tenantLogo?: string;
  orderNumber: string;
  placedAt: string;
  expectedReadyAt?: string;
  overallStatus: string;
  currentStep: number;
  steps: {
    key: string;
    label: string;
    isCompleted: boolean;
    isCurrent: boolean;
    timestamp?: string;
  }[];
  financialSummary: {
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
    paymentStatus: string;
  };
  pickup?: {
    status: string;
    scheduledDate: string;
    timeSlot?: string;
  };
  delivery?: {
    status: string;
    scheduledDate: string;
    timeSlot?: string;
  };
  itemsSummary: {
    itemCount: number;
    items: {
      name: string;
      quantity: number;
      service?: string;
    }[];
  };
}

export const customerTrackingApi = {
  async getTrackingByToken(token: string): Promise<PublicOrderTracking> {
    const res = await fetch(`${API_BASE_URL}/customer-tracking/${token}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const json = await res.json();
    if (!res.ok) {
      const errorMsg = json?.error?.message || json?.message || 'Invalid or expired tracking link';
      throw new Error(errorMsg);
    }

    return json.data || json;
  },

  async regenerateToken(orderId: string, token: string): Promise<{ trackingUrl: string; token: string }> {
    const res = await fetch(`${API_BASE_URL}/customer-tracking/${orderId}/regenerate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to regenerate tracking token');
    }
    return json.data || json;
  },

  async revokeToken(orderId: string, token: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/customer-tracking/${orderId}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to revoke tracking token');
    }
    return json.data || json;
  },
};
