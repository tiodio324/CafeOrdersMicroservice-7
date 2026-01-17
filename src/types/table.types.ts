// ============================================
// Table Types
// ============================================

export type TableStatus = 'free' | 'occupied' | 'reserved' | 'maintenance';

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TableFormData {
  number: number;
  capacity: number;
  status?: TableStatus;
  location?: string;
}

// Helper to get status label
export const getTableStatusLabel = (status: TableStatus): string => {
  const labels: Record<TableStatus, string> = {
    free: 'Свободен',
    occupied: 'Занят',
    reserved: 'Забронирован',
    maintenance: 'Обслуживание',
  };
  return labels[status];
};

// Helper to get status color
export const getTableStatusColor = (status: TableStatus): string => {
  const colors: Record<TableStatus, string> = {
    free: 'success',
    occupied: 'error',
    reserved: 'warning',
    maintenance: 'info',
  };
  return colors[status];
};
