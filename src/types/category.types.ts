// ============================================
// Category Types
// ============================================

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}
