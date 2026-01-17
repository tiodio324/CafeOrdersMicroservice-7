// ============================================
// Menu Item Types
// ============================================

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemFormData {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  imageUrl?: string;
  isAvailable?: boolean;
}

// Helper to format price
export const formatPrice = (price: number): string => {
  return `${price.toFixed(2)} ₽`;
};
