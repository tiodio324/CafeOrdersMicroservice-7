// ============================================
// Payment Types
// ============================================

export type PaymentMethod = 'cash' | 'card' | 'online';
export type PaymentStatus = 'pending' | 'completed' | 'refunded';

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  tip?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFormData {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  tip?: number;
}

// Helper to get payment method label
export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const labels: Record<PaymentMethod, string> = {
    cash: 'Наличные',
    card: 'Карта',
    online: 'Онлайн',
  };
  return labels[method];
};
