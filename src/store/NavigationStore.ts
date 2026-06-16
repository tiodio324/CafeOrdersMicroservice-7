import { makeAutoObservable } from 'mobx';
import { PageId, PageConfig, PAGES_CONFIG } from '@/types';
import { authStore } from './AuthStore';

export class NavigationStore {
  currentPage: PageId = 'home';
  sidebarOpen = true;
  mobileMenuOpen = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // Get navigation items based on user role
  get navigationItems(): PageConfig[] {
    return Object.values(PAGES_CONFIG).filter(page => {
      if (!page.showInNav) return false;
      return this.canAccessPage(page.id);
    });
  }

  // Get current page config
  get currentPageConfig(): PageConfig {
    return PAGES_CONFIG[this.currentPage];
  }

  // Get page title
  get pageTitle(): string {
    return this.currentPageConfig.title;
  }

  canAccessPage = (pageId: PageId): boolean => {
    const pageConfig = PAGES_CONFIG[pageId];
    if (!pageConfig) return false;

    if (pageConfig.requiresAuth && !authStore.isAuthenticated) {
      return false;
    }

    if (pageConfig.requiredRole === 'admin' && !authStore.isAdmin) {
      return false;
    }

    if (pageConfig.requiredRole === 'waiter' && !authStore.isWaiter) {
      return false;
    }

    if (pageId === 'orders' && !authStore.canViewOrders()) {
      return false;
    }

    if (pageId === 'tables' && !authStore.canViewTables()) {
      return false;
    }

    return true;
  };

  ensureAuthorizedPage = (): void => {
    if (!this.canAccessPage(this.currentPage)) {
      this.currentPage = authStore.canViewMenu() ? 'menu' : 'home';
    }
  };

  // Navigate to a page
  navigate = (pageId: PageId): void => {
    const pageConfig = PAGES_CONFIG[pageId];

    if (!pageConfig) {
      console.warn(`Page ${pageId} not found`);
      return;
    }

    if (pageConfig.requiresAuth && !authStore.isAuthenticated) {
      authStore.openLoginModal();
      return;
    }

    if (pageConfig.requiredRole === 'admin' && !authStore.isAdmin) {
      console.warn('Admin access required');
      return;
    }

    if (pageConfig.requiredRole === 'waiter' && !authStore.isWaiter) {
      authStore.openLoginModal();
      return;
    }

    if (pageId === 'orders' && !authStore.canViewOrders()) {
      return;
    }

    if (pageId === 'tables' && !authStore.canViewTables()) {
      return;
    }

    this.currentPage = pageId;
    this.closeMobileMenu();
  };

  // Sidebar controls
  toggleSidebar = (): void => {
    this.sidebarOpen = !this.sidebarOpen;
  };

  openSidebar = (): void => {
    this.sidebarOpen = true;
  };

  closeSidebar = (): void => {
    this.sidebarOpen = false;
  };

  // Mobile menu controls
  toggleMobileMenu = (): void => {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  };

  openMobileMenu = (): void => {
    this.mobileMenuOpen = true;
  };

  closeMobileMenu = (): void => {
    this.mobileMenuOpen = false;
  };
}

// Singleton instance
export const navigationStore = new NavigationStore();
