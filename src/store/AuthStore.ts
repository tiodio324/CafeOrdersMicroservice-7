import { makeAutoObservable } from 'mobx';
import { User, UserRole, ROLE_PERMISSIONS, RolePermissions } from '@/types';

const AUTH_STORAGE_KEY = 'cafe_orders_auth';
const SESSION_EXPIRY_KEY = 'cafe_orders_session_expiry';

const SESSION_DURATION = 24 * 60 * 60 * 1000;

export interface WaiterAccount {
  username: string;
  password: string;
  displayName: string;
}

export const WAITER_ACCOUNTS: WaiterAccount[] = [
  { username: 'anna', password: 'anna2026-cafe', displayName: 'Анна Иванова' },
  { username: 'boris', password: 'boris2026-cafe', displayName: 'Борис Петров' },
  { username: 'elena', password: 'elena2026-cafe', displayName: 'Елена Сидорова' },
  { username: 'dmitry', password: 'dmitry2026-cafe', displayName: 'Дмитрий Козлов' },
  { username: 'maria', password: 'maria2026-cafe', displayName: 'Мария Новикова' },
  { username: 'sergey', password: 'sergey2026-cafe', displayName: 'Сергей Морозов' },
  { username: 'olga', password: 'olga2026-cafe', displayName: 'Ольга Волкова' },
  { username: 'alexey', password: 'alexey2026-cafe', displayName: 'Алексей Соколов' },
  { username: 'natalia', password: 'natalia2026-cafe', displayName: 'Наталья Лебедева' },
  { username: 'ivan', password: 'ivan2026-cafe', displayName: 'Иван Кузнецов' },
];

const ADMIN_PASSWORD = 'admin2026-cafe';

interface StoredAuthState {
  role: UserRole;
  username?: string;
  displayName?: string;
  expiry: number;
}

export class AuthStore {
  private _user: User = {
    role: 'guest',
  };

  loginModalOpen = false;
  loginError: string | null = null;
  isLoading = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.loadAuthState();
  }

  get user(): User {
    return this._user;
  }

  get isAuthenticated(): boolean {
    return this._user.role !== 'guest';
  }

  get isWaiter(): boolean {
    return this._user.role === 'waiter' || this._user.role === 'admin';
  }

  get isAdmin(): boolean {
    return this._user.role === 'admin';
  }

  get permissions(): RolePermissions {
    return ROLE_PERMISSIONS[this._user.role];
  }

  get currentRole(): UserRole {
    return this._user.role;
  }

  canViewMenu = (): boolean => this.permissions.canViewMenu;
  canViewOrders = (): boolean => this.permissions.canViewOrders;
  canViewTables = (): boolean => this.permissions.canViewTables;
  canCreateOrders = (): boolean => this.permissions.canCreateOrders;
  canEditOrders = (): boolean => this.permissions.canEditOrders;
  canManageMenu = (): boolean => this.permissions.canManageMenu;
  canManageTables = (): boolean => this.permissions.canManageTables;
  canManageCategories = (): boolean => this.permissions.canManageCategories;
  canAccessAdmin = (): boolean => this.permissions.canAccessAdmin;

  hasRole = (requiredRole: UserRole): boolean => {
    const roleHierarchy: Record<UserRole, number> = {
      guest: 0,
      waiter: 1,
      admin: 2,
    };
    return roleHierarchy[this._user.role] >= roleHierarchy[requiredRole];
  };

  private loadAuthState = (): void => {
    try {
      const storedData = localStorage.getItem(AUTH_STORAGE_KEY);
      const expiryData = localStorage.getItem(SESSION_EXPIRY_KEY);

      if (storedData && expiryData) {
        const authState: StoredAuthState = JSON.parse(storedData);
        const expiry = parseInt(expiryData, 10);

        if (Date.now() < expiry && authState.role !== 'guest') {
          this._user = {
            role: authState.role,
            username: authState.username,
            displayName: authState.displayName,
          };
        } else {
          this.clearAuthStorage();
        }
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
      this.clearAuthStorage();
    }
  };

  private saveAuthState = (): void => {
    try {
      if (this._user.role !== 'guest') {
        const authState: StoredAuthState = {
          role: this._user.role,
          username: this._user.username,
          displayName: this._user.displayName,
          expiry: Date.now() + SESSION_DURATION,
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
        localStorage.setItem(SESSION_EXPIRY_KEY, String(authState.expiry));
      } else {
        this.clearAuthStorage();
      }
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  };

  private clearAuthStorage = (): void => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
    } catch (error) {
      console.error('Failed to clear auth storage:', error);
    }
  };

  openLoginModal = (): void => {
    this.loginModalOpen = true;
    this.loginError = null;
  };

  closeLoginModal = (): void => {
    this.loginModalOpen = false;
    this.loginError = null;
    this.isLoading = false;
  };

  login = async (
    role: Exclude<UserRole, 'guest'>,
    password: string,
    username?: string,
  ): Promise<boolean> => {
    this.isLoading = true;
    this.loginError = null;

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      if (role === 'waiter') {
        if (!username?.trim()) {
          this.loginError = 'Введите логин';
          return false;
        }

        const account = WAITER_ACCOUNTS.find(
          a => a.username === username.trim() && a.password === password,
        );

        if (account) {
          this._user = {
            role: 'waiter',
            username: account.username,
            displayName: account.displayName,
          };
          this.saveAuthState();
          this.closeLoginModal();
          return true;
        }

        this.loginError = 'Неверный логин или пароль';
        return false;
      }

      if (role === 'admin' && password === ADMIN_PASSWORD) {
        this._user = {
          role: 'admin',
          username: 'admin',
          displayName: 'Администратор',
        };
        this.saveAuthState();
        this.closeLoginModal();
        return true;
      }

      this.loginError = 'Неверный пароль';
      return false;
    } catch (error) {
      this.loginError = 'Ошибка авторизации';
      console.error('Login error:', error);
      return false;
    } finally {
      this.isLoading = false;
    }
  };

  logout = (): void => {
    this._user = { role: 'guest' };
    this.clearAuthStorage();
    this.loginError = null;
  };

  clearError = (): void => {
    this.loginError = null;
  };
}

export const authStore = new AuthStore();
