import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole, ROLE_PERMISSIONS, RolePermissions } from '@/types';
import FirebaseService from '@/firebase';

const AUTH_STORAGE_KEY = 'cafe_orders_auth';
const SESSION_EXPIRY_KEY = 'cafe_orders_session_expiry';

const SESSION_DURATION = 24 * 60 * 60 * 1000;

const WAITER_ACCOUNTS_PATH = 'officiantAccounts';

export interface WaiterAccount {
  username: string;
  password: string;
  displayName: string;
}

/** Учётная запись официанта, хранящаяся в Firebase Realtime Database */
export interface StoredWaiterAccount extends WaiterAccount {
  id: string;
  createdAt: string;
}

/** Запись для отображения в админ-таблице (встроенные + зарегистрированные) */
export interface WaiterAccountView extends WaiterAccount {
  id: string;
  isBuiltIn: boolean;
  createdAt?: string;
}

export type RegisterWaiterResult = { ok: true } | { ok: false; error: string };

/**
 * Встроенные (системные) учётные записи официантов. Их нельзя удалить через интерфейс —
 * они являются частью базовой поставки системы и используются как резервные.
 */
export const BUILT_IN_WAITER_ACCOUNTS: WaiterAccount[] = [
  { username: 'anna', password: 'anna2026-cafe', displayName: 'Анна Иванова' },
  { username: 'boris', password: 'boris2026-cafe', displayName: 'Борис Петров' }
];

const ADMIN_PASSWORD = 'admin2026-cafe';
const ADMIN_USERNAME = 'admin';
const RESERVED_USERNAMES = [ADMIN_USERNAME, 'guest', 'waiter'];

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

  /** Учётные записи официантов, заведённые администратором (Firebase RTDB) */
  dbWaiterAccounts: StoredWaiterAccount[] = [];
  waiterAccountsLoading = false;

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

  /** Полный список официантов для админ-панели: встроенные + зарегистрированные в БД */
  get waiterAccounts(): WaiterAccountView[] {
    const builtIn: WaiterAccountView[] = BUILT_IN_WAITER_ACCOUNTS.map(account => ({
      ...account,
      id: `builtin-${account.username}`,
      isBuiltIn: true,
    }));

    const stored: WaiterAccountView[] = this.dbWaiterAccounts
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(account => ({
        username: account.username,
        password: account.password,
        displayName: account.displayName,
        id: account.id,
        isBuiltIn: false,
        createdAt: account.createdAt,
      }));

    return [...builtIn, ...stored];
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

        const account = this.findWaiterAccount(username, password);

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
          username: ADMIN_USERNAME,
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

  // ============================================
  // Управление учётными записями официантов
  // ============================================

  private findWaiterAccount = (username: string, password: string): WaiterAccount | null => {
    const normalized = username.trim().toLowerCase();

    const builtIn = BUILT_IN_WAITER_ACCOUNTS.find(
      a => a.username.toLowerCase() === normalized && a.password === password,
    );
    if (builtIn) return builtIn;

    const stored = this.dbWaiterAccounts.find(
      a => a.username.toLowerCase() === normalized && a.password === password,
    );
    return stored
      ? { username: stored.username, password: stored.password, displayName: stored.displayName }
      : null;
  };

  loadWaiterAccounts = async (): Promise<void> => {
    this.waiterAccountsLoading = true;
    try {
      const data = await FirebaseService.getData<Record<string, StoredWaiterAccount>>(
        WAITER_ACCOUNTS_PATH,
      );
      runInAction(() => {
        this.dbWaiterAccounts = data ? Object.values(data) : [];
        this.waiterAccountsLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.waiterAccountsLoading = false;
      });
      console.error('Load waiter accounts error:', error);
    }
  };

  registerWaiterAccount = async (data: {
    displayName: string;
    username: string;
    password: string;
  }): Promise<RegisterWaiterResult> => {
    if (!this.isAdmin) {
      return { ok: false, error: 'Недостаточно прав' };
    }

    const displayName = data.displayName.trim();
    const username = data.username.trim().toLowerCase();
    const password = data.password;

    if (!displayName) return { ok: false, error: 'Введите имя сотрудника' };
    if (!username) return { ok: false, error: 'Введите логин' };
    if (/\s/.test(username)) return { ok: false, error: 'Логин не должен содержать пробелов' };
    if (!password.trim()) return { ok: false, error: 'Введите пароль' };
    if (password.length < 4) return { ok: false, error: 'Пароль должен быть не короче 4 символов' };

    if (RESERVED_USERNAMES.includes(username)) {
      return { ok: false, error: 'Этот логин зарезервирован системой, выберите другой' };
    }

    try {
      const data = await FirebaseService.getData<Record<string, StoredWaiterAccount>>(
        WAITER_ACCOUNTS_PATH,
      );
      runInAction(() => {
        this.dbWaiterAccounts = data ? Object.values(data) : [];
      });
    } catch (error) {
      console.error('Refresh waiter accounts error: ', error);
      // Если обновить не удалось — продолжаем проверку по локальным данным.
    }

    const usernameTaken = this.waiterAccounts.some(
      a => a.username.toLowerCase() === username,
    );
    if (usernameTaken) {
      return { ok: false, error: 'Сотрудник с таким логином уже существует' };
    }

    const account: StoredWaiterAccount = {
      id: uuidv4(),
      username,
      password,
      displayName,
      createdAt: new Date().toISOString(),
    };

    try {
      await FirebaseService.setData(`${WAITER_ACCOUNTS_PATH}/${account.id}`, account);
      runInAction(() => {
        this.dbWaiterAccounts.push(account);
      });
      return { ok: true };
    } catch (error) {
      console.error('Register waiter account error:', error);
      return { ok: false, error: 'Не удалось сохранить сотрудника. Попробуйте ещё раз' };
    }
  };

  deleteWaiterAccount = async (id: string): Promise<boolean> => {
    if (!this.isAdmin) return false;

    const index = this.dbWaiterAccounts.findIndex(a => a.id === id);
    if (index === -1) return false;

    try {
      await FirebaseService.removeData(`${WAITER_ACCOUNTS_PATH}/${id}`);
      runInAction(() => {
        this.dbWaiterAccounts.splice(index, 1);
      });
      return true;
    } catch (error) {
      console.error('Delete waiter account error:', error);
      return false;
    }
  };
}

export const authStore = new AuthStore();
