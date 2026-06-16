import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import { 
  MenuItem, 
  MenuItemFormData,
  Category, 
  CategoryFormData,
  Table, 
  TableFormData,
  Order, 
  OrderFormData,
  OrderItem,
  Payment,
  PaymentFormData,
  FilterParams,
  calculateOrderTotal
} from '@/types';
import FirebaseService from '@/firebase';
import { authStore } from './AuthStore';
import {
  validateCategoryForm,
  validateMenuItemForm,
  validateTableForm,
} from '@/utils/validators';

export class DataStore {
  // Data collections
  menuItems: MenuItem[] = [];
  categories: Category[] = [];
  tables: Table[] = [];
  orders: Order[] = [];
  payments: Payment[] = [];

  // Loading states
  menuItemsLoading = false;
  categoriesLoading = false;
  tablesLoading = false;
  ordersLoading = false;
  paymentsLoading = false;

  // Error states
  error: string | null = null;

  // Filters
  filters: FilterParams = {};

  // Selected items
  selectedCategoryId: string | null = null;
  selectedTableId: string | null = null;
  selectedDate: string = new Date().toISOString().split('T')[0];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // ============================================
  // Computed values
  // ============================================

  get filteredMenuItems(): MenuItem[] {
    let result = this.menuItems.filter(m => m.isActive);

    if (this.filters.categoryId) {
      result = result.filter(m => m.categoryId === this.filters.categoryId);
    }

    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(searchLower) ||
        m.description.toLowerCase().includes(searchLower)
      );
    }

    return result.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  get activeCategories(): Category[] {
    return this.categories
      .filter(c => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  get activeTables(): Table[] {
    return this.tables
      .filter(t => t.isActive)
      .sort((a, b) => a.number - b.number);
  }

  get visibleOrders(): Order[] {
    if (authStore.isAdmin) {
      return this.orders;
    }

    if (authStore.isWaiter && authStore.user.username) {
      return this.orders.filter(o => o.createdBy === authStore.user.username);
    }

    return [];
  }

  get activeOrders(): Order[] {
    return this.visibleOrders
      .filter(o => o.status !== 'cancelled' && o.status !== 'paid')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  get todayOrders(): Order[] {
    const today = new Date().toISOString().split('T')[0];
    return this.visibleOrders.filter(o => o.createdAt.startsWith(today));
  }

  get menuItemsByCategory(): Record<string, MenuItem[]> {
    const grouped: Record<string, MenuItem[]> = {};
    
    for (const item of this.filteredMenuItems) {
      if (!grouped[item.categoryId]) {
        grouped[item.categoryId] = [];
      }
      grouped[item.categoryId].push(item);
    }
    
    return grouped;
  }

  getCategoryById = (id: string): Category | undefined => {
    return this.categories.find(c => c.id === id);
  };

  getMenuItemById = (id: string): MenuItem | undefined => {
    return this.menuItems.find(m => m.id === id);
  };

  getTableById = (id: string): Table | undefined => {
    return this.tables.find(t => t.id === id);
  };

  getOrderById = (id: string): Order | undefined => {
    return this.orders.find(o => o.id === id);
  };

  getOrdersForTable = (tableId: string): Order[] => {
    return this.visibleOrders.filter(o => o.tableId === tableId && o.status !== 'paid' && o.status !== 'cancelled');
  };

  // ============================================
  // Data loading methods
  // ============================================

  loadAllData = async (): Promise<void> => {
    await Promise.all([
      this.loadCategories(),
      this.loadMenuItems(),
      this.loadTables(),
      this.loadOrders(),
      this.loadPayments(),
    ]);
  };

  loadMenuItems = async (): Promise<void> => {
    this.menuItemsLoading = true;
    this.error = null;
    
    try {
      const data = await FirebaseService.getData<Record<string, MenuItem>>('menuItems');
      runInAction(() => {
        this.menuItems = data ? Object.values(data) : [];
        this.menuItemsLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = 'Ошибка загрузки меню';
        this.menuItemsLoading = false;
        console.error('Load menu items error:', error);
      });
    }
  };

  loadCategories = async (): Promise<void> => {
    this.categoriesLoading = true;
    
    try {
      const data = await FirebaseService.getData<Record<string, Category>>('categories');
      runInAction(() => {
        this.categories = data ? Object.values(data) : [];
        this.categoriesLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = 'Ошибка загрузки категорий';
        this.categoriesLoading = false;
        console.error('Load categories error:', error);
      });
    }
  };

  loadTables = async (): Promise<void> => {
    this.tablesLoading = true;
    
    try {
      const data = await FirebaseService.getData<Record<string, Table>>('tables');
      runInAction(() => {
        this.tables = data ? Object.values(data) : [];
        this.tablesLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = 'Ошибка загрузки столиков';
        this.tablesLoading = false;
        console.error('Load tables error:', error);
      });
    }
  };

  loadOrders = async (): Promise<void> => {
    this.ordersLoading = true;
    
    try {
      const data = await FirebaseService.getData<Record<string, Order>>('orders');
      runInAction(() => {
        this.orders = data ? Object.values(data) : [];
        this.ordersLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = 'Ошибка загрузки заказов';
        this.ordersLoading = false;
        console.error('Load orders error:', error);
      });
    }
  };

  loadPayments = async (): Promise<void> => {
    this.paymentsLoading = true;
    
    try {
      const data = await FirebaseService.getData<Record<string, Payment>>('payments');
      runInAction(() => {
        this.payments = data ? Object.values(data) : [];
        this.paymentsLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = 'Ошибка загрузки платежей';
        this.paymentsLoading = false;
        console.error('Load payments error:', error);
      });
    }
  };

  // ============================================
  // CRUD operations for Menu Items
  // ============================================

  createMenuItem = async (data: MenuItemFormData): Promise<MenuItem | null> => {
    if (!authStore.canManageMenu()) return null;

    const validation = validateMenuItemForm(data);
    if (!validation.valid) return null;

    const now = new Date().toISOString();
    const menuItem: MenuItem = {
      id: uuidv4(),
      ...data,
      isAvailable: data.isAvailable ?? true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await FirebaseService.setData(`menuItems/${menuItem.id}`, menuItem);
      runInAction(() => {
        this.menuItems.push(menuItem);
      });
      return menuItem;
    } catch (error) {
      console.error('Create menu item error:', error);
      return null;
    }
  };

  updateMenuItem = async (id: string, data: Partial<MenuItemFormData>): Promise<boolean> => {
    if (!authStore.canManageMenu()) return false;

    const index = this.menuItems.findIndex(m => m.id === id);
    if (index === -1) return false;

    const existing = this.menuItems[index];
    const merged: MenuItemFormData = {
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      categoryId: data.categoryId ?? existing.categoryId,
      price: data.price ?? existing.price,
      imageUrl: data.imageUrl ?? existing.imageUrl,
      isAvailable: data.isAvailable ?? existing.isAvailable,
    };

    const validation = validateMenuItemForm(merged);
    if (!validation.valid) return false;

    const updated = {
      ...existing,
      ...merged,
      updatedAt: new Date().toISOString(),
    };

    try {
      await FirebaseService.setData(`menuItems/${id}`, updated);
      runInAction(() => {
        this.menuItems[index] = updated;
      });
      return true;
    } catch (error) {
      console.error('Update menu item error:', error);
      return false;
    }
  };

  deleteMenuItem = async (id: string): Promise<boolean> => {
    if (!authStore.canManageMenu()) return false;

    const index = this.menuItems.findIndex(m => m.id === id);
    if (index === -1) return false;

    try {
      await FirebaseService.updateData(`menuItems/${id}`, { isActive: false });
      runInAction(() => {
        this.menuItems[index].isActive = false;
      });
      return true;
    } catch (error) {
      console.error('Delete menu item error:', error);
      return false;
    }
  };

  // ============================================
  // CRUD operations for Categories
  // ============================================

  createCategory = async (data: CategoryFormData): Promise<Category | null> => {
    if (!authStore.canManageCategories()) return null;

    const validation = validateCategoryForm(data);
    if (!validation.valid) return null;

    const now = new Date().toISOString();
    const category: Category = {
      id: uuidv4(),
      ...data,
      sortOrder: data.sortOrder ?? this.categories.length,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await FirebaseService.setData(`categories/${category.id}`, category);
      runInAction(() => {
        this.categories.push(category);
      });
      return category;
    } catch (error) {
      console.error('Create category error:', error);
      return null;
    }
  };

  updateCategory = async (id: string, data: Partial<CategoryFormData>): Promise<boolean> => {
    if (!authStore.canManageCategories()) return false;

    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) return false;

    const existing = this.categories[index];
    const merged: CategoryFormData = {
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      icon: data.icon ?? existing.icon,
      sortOrder: data.sortOrder ?? existing.sortOrder,
    };

    const validation = validateCategoryForm(merged);
    if (!validation.valid) return false;

    const updated = {
      ...existing,
      ...merged,
      updatedAt: new Date().toISOString(),
    };

    try {
      await FirebaseService.setData(`categories/${id}`, updated);
      runInAction(() => {
        this.categories[index] = updated;
      });
      return true;
    } catch (error) {
      console.error('Update category error:', error);
      return false;
    }
  };

  deleteCategory = async (id: string): Promise<boolean> => {
    if (!authStore.canManageCategories()) return false;

    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) return false;

    try {
      await FirebaseService.updateData(`categories/${id}`, { isActive: false });
      runInAction(() => {
        this.categories[index].isActive = false;
      });
      return true;
    } catch (error) {
      console.error('Delete category error:', error);
      return false;
    }
  };

  // ============================================
  // CRUD operations for Tables
  // ============================================

  createTable = async (data: TableFormData): Promise<Table | null> => {
    if (!authStore.canManageTables()) return null;

    const validation = validateTableForm(data);
    if (!validation.valid) return null;

    const now = new Date().toISOString();
    const table: Table = {
      id: uuidv4(),
      ...data,
      status: data.status ?? 'free',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await FirebaseService.setData(`tables/${table.id}`, table);
      runInAction(() => {
        this.tables.push(table);
      });
      return table;
    } catch (error) {
      console.error('Create table error:', error);
      return null;
    }
  };

  updateTable = async (id: string, data: Partial<TableFormData>): Promise<boolean> => {
    if (!authStore.canManageTables()) return false;

    const index = this.tables.findIndex(t => t.id === id);
    if (index === -1) return false;

    const existing = this.tables[index];
    const merged: TableFormData = {
      number: data.number ?? existing.number,
      capacity: data.capacity ?? existing.capacity,
      status: data.status ?? existing.status,
      location: data.location ?? existing.location,
    };

    const validation = validateTableForm(merged);
    if (!validation.valid) return false;

    const updated = {
      ...existing,
      ...merged,
      updatedAt: new Date().toISOString(),
    };

    try {
      await FirebaseService.setData(`tables/${id}`, updated);
      runInAction(() => {
        this.tables[index] = updated;
      });
      return true;
    } catch (error) {
      console.error('Update table error:', error);
      return false;
    }
  };

  deleteTable = async (id: string): Promise<boolean> => {
    if (!authStore.canManageTables()) return false;

    const index = this.tables.findIndex(t => t.id === id);
    if (index === -1) return false;

    try {
      await FirebaseService.updateData(`tables/${id}`, { isActive: false });
      runInAction(() => {
        this.tables[index].isActive = false;
      });
      return true;
    } catch (error) {
      console.error('Delete table error:', error);
      return false;
    }
  };

  // ============================================
  // CRUD operations for Orders
  // ============================================

  createOrder = async (data: OrderFormData): Promise<Order | null> => {
    if (!authStore.canCreateOrders()) return null;

    const table = this.getTableById(data.tableId);
    if (!table) return null;

    const items: OrderItem[] = data.items.map(item => {
      const menuItem = this.getMenuItemById(item.menuItemId);
      return {
        ...item,
        menuItemName: menuItem?.name || 'Неизвестно',
      };
    });

    const now = new Date().toISOString();
    const order: Order = {
      id: uuidv4(),
      tableId: data.tableId,
      tableNumber: table.number,
      items,
      status: 'pending',
      totalAmount: calculateOrderTotal(items),
      notes: data.notes || '',
      createdBy: authStore.user.username || authStore.currentRole,
      createdByName: authStore.user.displayName,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await FirebaseService.setData(`orders/${order.id}`, order);
      runInAction(() => {
        this.orders.push(order);
      });
      // Update table status
      await this.updateTable(data.tableId, { status: 'occupied' });
      return order;
    } catch (error) {
      console.error('Create order error:', error);
      return null;
    }
  };

  updateOrder = async (id: string, data: Partial<Order>): Promise<boolean> => {
    if (!authStore.canEditOrders()) return false;

    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) return false;

    const order = this.orders[index];
    if (!authStore.isAdmin && order.createdBy !== authStore.user.username) {
      return false;
    }

    const updated = {
      ...this.orders[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    try {
      await FirebaseService.setData(`orders/${id}`, updated);
      runInAction(() => {
        this.orders[index] = updated;
      });
      return true;
    } catch (error) {
      console.error('Update order error:', error);
      return false;
    }
  };

  updateOrderStatus = async (id: string, status: Order['status']): Promise<boolean> => {
    return this.updateOrder(id, { status });
  };

  // ============================================
  // CRUD operations for Payments
  // ============================================

  createPayment = async (data: PaymentFormData): Promise<Payment | null> => {
    if (!authStore.canEditOrders()) return null;

    const now = new Date().toISOString();
    const payment: Payment = {
      id: uuidv4(),
      ...data,
      status: 'completed',
      createdAt: now,
      updatedAt: now,
    };

    try {
      await FirebaseService.setData(`payments/${payment.id}`, payment);
      runInAction(() => {
        this.payments.push(payment);
      });
      // Update order status to paid
      await this.updateOrderStatus(data.orderId, 'paid');
      return payment;
    } catch (error) {
      console.error('Create payment error:', error);
      return null;
    }
  };

  // ============================================
  // Filter and selection methods
  // ============================================

  setFilter = (key: keyof FilterParams, value: string | undefined): void => {
    this.filters = { ...this.filters, [key]: value };
  };

  clearFilters = (): void => {
    this.filters = {};
  };

  setSelectedCategory = (categoryId: string | null): void => {
    this.selectedCategoryId = categoryId;
    this.filters.categoryId = categoryId || undefined;
  };

  setSelectedTable = (tableId: string | null): void => {
    this.selectedTableId = tableId;
    this.filters.tableId = tableId || undefined;
  };

  setSelectedDate = (date: string): void => {
    this.selectedDate = date;
  };

  clearError = (): void => {
    this.error = null;
  };
}

// Singleton instance
export const dataStore = new DataStore();
