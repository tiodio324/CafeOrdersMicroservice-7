import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore, navigationStore } from '@/store';
import { Card, Button, Badge } from '@/components/UI';
import styles from './HomePage.module.scss';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'info';
}) => (
  <Card className={`${styles.statCard} ${styles[color]}`}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statContent}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statTitle}>{title}</span>
    </div>
  </Card>
);

export const HomePage = observer(() => {
  const { menuItems, categories, tables, orders, loadAllData, menuItemsLoading } = dataStore;
  const { isWaiter, isAdmin } = authStore;
  const { navigate } = navigationStore;

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const activeMenuItems = menuItems.filter(m => m.isActive && m.isAvailable);
  const activeCategories = categories.filter(c => c.isActive);
  const activeTables = tables.filter(t => t.isActive);
  const freeTables = activeTables.filter(t => t.status === 'free');
  
  // Calculate today's orders
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
  const activeOrders = orders.filter(o => 
    o.status !== 'paid' && o.status !== 'cancelled'
  );

  // Calculate today's revenue
  const todayRevenue = todayOrders
    .filter(o => o.status === 'paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className={styles.page}>
      <section className={styles.welcome}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>
            Добро пожаловать в систему заказов кафе
          </h1>
          <p className={styles.welcomeText}>
            Микросервисная система для управления заказами, меню и столиками.
            {!isWaiter && ' Войдите в систему для создания и редактирования заказов.'}
          </p>
          {!authStore.isAuthenticated && (
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => authStore.openLoginModal()}
            >
              Войти в систему
            </Button>
          )}
        </div>
        <div className={styles.welcomeDecor}>
          <svg viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" opacity="0.2" />
            <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="2" opacity="0.4" />
            <path d="M100 30 L100 170 M30 100 L170 100" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          </svg>
        </div>
      </section>

      <section className={styles.stats}>
        <StatCard 
          title="Позиций в меню"
          value={menuItemsLoading ? '...' : activeMenuItems.length}
          color="primary"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h18v18H3zM3 9h18M9 21V9" />
            </svg>
          }
        />
        <StatCard 
          title="Активных заказов"
          value={activeOrders.length}
          color="warning"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />
        <StatCard 
          title="Свободных столов"
          value={`${freeTables.length}/${activeTables.length}`}
          color="info"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="12" rx="2" />
              <line x1="3" y1="20" x2="7" y2="16" />
              <line x1="21" y1="20" x2="17" y2="16" />
            </svg>
          }
        />
        <StatCard 
          title="Выручка сегодня"
          value={`${todayRevenue.toFixed(0)} ₽`}
          color="success"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
      </section>

      <section className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Быстрые действия</h2>
        <div className={styles.actionCards}>
          <Card 
            className={styles.actionCard} 
            hoverable 
            onClick={() => navigate('menu')}
          >
            <div className={styles.actionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h18v18H3zM3 9h18M9 21V9" />
              </svg>
            </div>
            <h3>Меню</h3>
            <p>Просмотр блюд и напитков</p>
            <Badge variant="info">{activeCategories.length} категорий</Badge>
          </Card>

          <Card 
            className={styles.actionCard} 
            hoverable 
            onClick={() => navigate('orders')}
          >
            <div className={styles.actionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h3>Заказы</h3>
            <p>Управление заказами</p>
            {activeOrders.length > 0 && (
              <Badge variant="warning">{activeOrders.length} активных</Badge>
            )}
          </Card>

          <Card 
            className={styles.actionCard} 
            hoverable 
            onClick={() => navigate('tables')}
          >
            <div className={styles.actionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="12" rx="2" />
                <line x1="3" y1="20" x2="7" y2="16" />
                <line x1="21" y1="20" x2="17" y2="16" />
              </svg>
            </div>
            <h3>Столики</h3>
            <p>Схема зала и бронирование</p>
            <Badge variant={freeTables.length > 0 ? 'success' : 'error'}>
              {freeTables.length} свободно
            </Badge>
          </Card>

          {isAdmin && (
            <Card 
              className={styles.actionCard} 
              hoverable 
              onClick={() => navigate('admin')}
            >
              <div className={styles.actionIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </div>
              <h3>Администрирование</h3>
              <p>Управление данными системы</p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
});
