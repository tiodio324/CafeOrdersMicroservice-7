import { observer } from 'mobx-react-lite';
import { dataStore, authStore } from '@/store';
import { Card, Badge, Select } from '@/components/UI';
import { TableStatus, getTableStatusLabel, getTableStatusColor } from '@/types';
import styles from './TablesPage.module.scss';

export const TablesPage = observer(() => {
  const {
    activeTables,
    tablesLoading,
    updateTable,
    getOrdersForTable,
  } = dataStore;
  const { isAdmin } = authStore;

  const handleStatusChange = async (tableId: string, status: TableStatus) => {
    await updateTable(tableId, { status });
  };

  const statusOptions: Array<{ value: TableStatus; label: string }> = [
    { value: 'free', label: 'Свободен' },
    { value: 'occupied', label: 'Занят' },
    { value: 'reserved', label: 'Забронирован' },
    { value: 'maintenance', label: 'Обслуживание' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Столики</h1>
      </div>

      <div className={styles.legend}>
        {statusOptions.map(opt => (
          <div key={opt.value} className={styles.legendItem}>
            <Badge variant={getTableStatusColor(opt.value) as 'success' | 'warning' | 'error' | 'info'}>
              {opt.label}
            </Badge>
          </div>
        ))}
      </div>

      {tablesLoading ? (
        <div className={styles.loading}>Загрузка столиков...</div>
      ) : activeTables.length === 0 ? (
        <div className={styles.empty}>Столики не найдены</div>
      ) : (
        <div className={styles.grid}>
          {activeTables.map(table => {
            const tableOrders = getOrdersForTable(table.id);
            return (
              <Card
                key={table.id}
                className={`${styles.tableCard} ${styles[table.status]}`}
              >
                <div className={styles.tableNumber}>
                  <span className={styles.number}>{table.number}</span>
                  <Badge variant={getTableStatusColor(table.status) as 'success' | 'warning' | 'error' | 'info'}>
                    {getTableStatusLabel(table.status)}
                  </Badge>
                </div>

                <div className={styles.tableInfo}>
                  <div className={styles.capacity}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    {table.capacity} мест
                  </div>
                  {table.location && (
                    <div className={styles.location}>{table.location}</div>
                  )}
                </div>

                {tableOrders.length > 0 && (
                  <div className={styles.orderInfo}>
                    {tableOrders.length} активных заказов
                  </div>
                )}

                {isAdmin && (
                  <div className={styles.tableActions}>
                    <Select
                      options={statusOptions}
                      value={table.status}
                      onChange={(e) => handleStatusChange(table.id, e.target.value as TableStatus)}
                      className={styles.statusSelect}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
});
