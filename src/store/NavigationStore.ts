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
      
      if (page.requiresAuth && !authStore.isAuthenticated) {
        return false;
      }
      
      if (page.requiredRole === 'admin' && !authStore.isAdmin) {
        return false;
      }
      
      if (page.requiredRole === 'waiter' && !authStore.isWaiter) {
        return false;
      }
      
      return true;
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

  // Navigate to a page
  navigate = (pageId: PageId): void => {
    const pageConfig = PAGES_CONFIG[pageId];
    
    if (!pageConfig) {
      console.warn(`Page ${pageId} not found`);
      return;
    }

    // Check auth requirements
    if (pageConfig.requiresAuth && !authStore.isAuthenticated) {
      authStore.openLoginModal();
      return;
    }

    // Check role requirements
    if (pageConfig.requiredRole === 'admin' && !authStore.isAdmin) {
      console.warn('Admin access required');
      return;
    }

    if (pageConfig.requiredRole === 'waiter' && !authStore.isWaiter) {
      console.warn('Waiter access required');
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
