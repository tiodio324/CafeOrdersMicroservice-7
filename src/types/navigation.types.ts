// ============================================
// Navigation Types
// ============================================

export type PageId = 
  | 'home'
  | 'menu'
  | 'orders'
  | 'tables'
  | 'admin'
  | 'admin-menu'
  | 'admin-categories'
  | 'admin-tables';

export interface PageConfig {
  id: PageId;
  title: string;
  icon: string;
  requiresAuth: boolean;
  requiredRole?: 'waiter' | 'admin';
  showInNav: boolean;
  parentId?: PageId;
}

export const PAGES_CONFIG: Record<PageId, PageConfig> = {
  home: {
    id: 'home',
    title: 'Главная',
    icon: 'home',
    requiresAuth: false,
    showInNav: true,
  },
  menu: {
    id: 'menu',
    title: 'Меню',
    icon: 'menu-book',
    requiresAuth: false,
    showInNav: true,
  },
  orders: {
    id: 'orders',
    title: 'Заказы',
    icon: 'receipt',
    requiresAuth: true,
    requiredRole: 'waiter',
    showInNav: true,
  },
  tables: {
    id: 'tables',
    title: 'Столики',
    icon: 'table',
    requiresAuth: true,
    requiredRole: 'waiter',
    showInNav: true,
  },
  admin: {
    id: 'admin',
    title: 'Администрирование',
    icon: 'settings',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: true,
  },
  'admin-menu': {
    id: 'admin-menu',
    title: 'Управление меню',
    icon: 'food-menu',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: false,
    parentId: 'admin',
  },
  'admin-categories': {
    id: 'admin-categories',
    title: 'Управление категориями',
    icon: 'category',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: false,
    parentId: 'admin',
  },
  'admin-tables': {
    id: 'admin-tables',
    title: 'Управление столиками',
    icon: 'table-settings',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: false,
    parentId: 'admin',
  },
};
