import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore } from '@/store';
import { Card, Button, Badge, Modal, Input, Select } from '@/components/UI';
import { Table, TableFormData, TableStatus, getTableStatusLabel, getTableStatusColor } from '@/types';
import styles from './TablesPage.module.scss';

export const TablesPage = observer(() => {
  const { 
    activeTables, 
    tablesLoading,
    createTable,
    updateTable,
    deleteTable,
    getOrdersForTable
  } = dataStore;
  const { isAdmin, isWaiter } = authStore;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState<TableFormData>({
    number: 0,
    capacity: 4,
    status: 'free',
    location: '',
  });

  const handleOpenModal = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        number: table.number,
        capacity: table.capacity,
        status: table.status,
        location: table.location,
      });
    } else {
      setEditingTable(null);
      const maxNumber = Math.max(0, ...activeTables.map(t => t.number));
      setFormData({
        number: maxNumber + 1,
        capacity: 4,
        status: 'free',
        location: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTable(null);
  };

  const handleSubmit = async () => {
    if (editingTable) {
      await updateTable(editingTable.id, formData);
    } else {
      await createTable(formData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот столик?')) {
      await deleteTable(id);
    }
  };

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
        {isAdmin && (
          <Button variant="primary" onClick={() => handleOpenModal()}>
            Добавить столик
          </Button>
        )}
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

                {isWaiter && (
                  <div className={styles.tableActions}>
                    <Select
                      options={statusOptions}
                      value={table.status}
                      onChange={(e) => handleStatusChange(table.id, e.target.value as TableStatus)}
                      className={styles.statusSelect}
                    />
                    {isAdmin && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => handleOpenModal(table)}>
                          ✏️
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(table.id)}>
                          🗑️
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTable ? 'Редактировать столик' : 'Добавить столик'}
      >
        <div className={styles.form}>
          <Input
            label="Номер столика"
            type="number"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 0 })}
            required
          />
          <Input
            label="Вместимость"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
            required
          />
          <Select
            label="Статус"
            options={statusOptions}
            value={formData.status || 'free'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as TableStatus })}
          />
          <Input
            label="Расположение"
            value={formData.location || ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Например: У окна, Терраса"
          />
          <div className={styles.formActions}>
            <Button variant="secondary" onClick={handleCloseModal}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingTable ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
});
