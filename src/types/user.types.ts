// ============================================
// User & Role Types - Cafe Orders System
// ============================================

export type UserRole = 'guest' | 'waiter' | 'admin';

export interface User {
  role: UserRole;
}

export interface RolePermissions {
  canViewMenu: boolean;
  canViewOrders: boolean;
  canViewTables: boolean;
  canCreateOrders: boolean;
  canEditOrders: boolean;
  canManageMenu: boolean;
  canManageTables: boolean;
  canManageCategories: boolean;
  canAccessAdmin: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  guest: {
    canViewMenu: true,
    canViewOrders: true,
    canViewTables: true,
    canCreateOrders: false,
    canEditOrders: false,
    canManageMenu: false,
    canManageTables: false,
    canManageCategories: false,
    canAccessAdmin: false,
  },
  waiter: {
    canViewMenu: true,
    canViewOrders: true,
    canViewTables: true,
    canCreateOrders: true,
    canEditOrders: true,
    canManageMenu: false,
    canManageTables: false,
    canManageCategories: false,
    canAccessAdmin: false,
  },
  admin: {
    canViewMenu: true,
    canViewOrders: true,
    canViewTables: true,
    canCreateOrders: true,
    canEditOrders: true,
    canManageMenu: true,
    canManageTables: true,
    canManageCategories: true,
    canAccessAdmin: true,
  },
};
