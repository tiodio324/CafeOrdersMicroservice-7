// ============================================
// Order Types
// ============================================

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';

export interface OrderItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableId: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFormData {
  tableId: string;
  items: Omit<OrderItem, 'menuItemName'>[];
  notes?: string;
}

// Helper to get status label
export const getOrderStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    pending: 'Ожидает',
    preparing: 'Готовится',
    ready: 'Готов',
    served: 'Подан',
    paid: 'Оплачен',
    cancelled: 'Отменён',
  };
  return labels[status];
};

// Helper to get status color
export const getOrderStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    pending: 'warning',
    preparing: 'info',
    ready: 'success',
    served: 'primary',
    paid: 'success',
    cancelled: 'error',
  };
  return colors[status];
};

// Helper to calculate order total
export const calculateOrderTotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};
