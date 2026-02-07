import { observer } from 'mobx-react-lite';
import { authStore, navigationStore } from '@/store';
import { Button } from '@/components/UI';
import styles from './Header.module.scss';

export const Header = observer(() => {
  const { isAuthenticated, currentRole, logout, openLoginModal } = authStore;
  const { pageTitle, toggleMobileMenu, mobileMenuOpen, navigate } = navigationStore;

  const getRoleName = (role: string): string => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'teacher': return 'Преподаватель';
      default: return 'Гость';
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button 
          className={styles.menuButton}
          onClick={toggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <path d="M3 12h18M3 6h18M3 18h18" />
              </>
            )}
          </svg>
        </button>
        <div className={styles.divider} />
        <div
          className={styles.logo}
          onClick={() => navigate('home')}
          aria-label="Перейти на главную страницу"
        >
          <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8h1a4 4 0 010 8h-1" />
            <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
          </svg>
          <span className={styles.logoText}>Заказы в кафе</span>
        </div>
      </div>

      <div className={styles.titleWrapper}>
        <h1 className={styles.title}>{pageTitle}</h1>
      </div>

      <div className={styles.right}>
        {isAuthenticated ? (
          <div className={styles.userInfo}>
            <span className={styles.role}>{getRoleName(currentRole)}</span>
            <div className={styles.divider} />
            <Button variant="ghost" size="sm" onClick={logout} className={styles.headerButton}>
              Выйти
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={openLoginModal} className={styles.headerButton}>
            Войти
          </Button>
        )}
      </div>
    </header>
  );
});
