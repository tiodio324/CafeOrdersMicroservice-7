import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore } from '@/store';
import { Card, Button, Select, Badge, Modal, Table, type TableColumn } from '@/components/UI';
import { Order, OrderStatus, getOrderStatusLabel, getOrderStatusColor, formatPrice, getOrderCreatorLabel } from '@/types';
import styles from './OrdersPage.module.scss';

export const OrdersPage = observer(() => {
  const { 
    visibleOrders,
    activeOrders,
    activeTables,
    filteredMenuItems,
    ordersLoading,
    createOrder,
    updateOrderStatus,
  } = dataStore;
  const { isWaiter, isAdmin } = authStore;
  
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [orderItems, setOrderItems] = useState<Array<{ menuItemId: string; quantity: number; price: number }>>([]);

  const filteredOrders = statusFilter === 'active' 
    ? activeOrders 
    : statusFilter === 'all' 
      ? visibleOrders 
      : visibleOrders.filter(o => o.status === statusFilter);

  const statusOptions = [
    { value: 'active', label: 'Активные' },
    { value: 'all', label: 'Все заказы' },
    { value: 'pending', label: 'Ожидают' },
    { value: 'preparing', label: 'Готовятся' },
    { value: 'ready', label: 'Готовы' },
    { value: 'served', label: 'Поданы' },
    { value: 'paid', label: 'Оплачены' },
  ];

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await updateOrderStatus(orderId, newStatus);
  };

  const handleOpenModal = () => {
    setSelectedTableId(activeTables[0]?.id || '');
    setOrderItems([]);
    setIsModalOpen(true);
  };

  const handleAddItem = (menuItemId: string, price: number) => {
    const existing = orderItems.find(i => i.menuItemId === menuItemId);
    if (existing) {
      setOrderItems(orderItems.map(i => 
        i.menuItemId === menuItemId 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setOrderItems([...orderItems, { menuItemId, quantity: 1, price }]);
    }
  };

  const handleRemoveItem = (menuItemId: string) => {
    setOrderItems(orderItems.filter(i => i.menuItemId !== menuItemId));
  };

  const handleCreateOrder = async () => {
    if (selectedTableId && orderItems.length > 0) {
      const result = await createOrder({
        tableId: selectedTableId,
        items: orderItems,
      });
      if (result) {
        setIsModalOpen(false);
        setSelectedTableId('');
        setOrderItems([]);
      }
    }
  };

  const getNextStatus = (status: OrderStatus): OrderStatus | null => {
    const flow: Record<OrderStatus, OrderStatus | null> = {
      pending: 'preparing',
      preparing: 'ready',
      ready: 'served',
      served: 'paid',
      paid: null,
      cancelled: null,
    };
    return flow[status];
  };

  const columns: TableColumn<Order>[] = [
    { key: 'tableNumber', title: 'Стол', render: (order: Order) => `Стол ${order.tableNumber}` },
    ...(isAdmin ? [{
      key: 'createdBy',
      title: 'Официант',
      render: (order: Order) => getOrderCreatorLabel(order),
    }] : []),
    { key: 'items', title: 'Позиции', render: (order: Order) => `${order.items.length} поз.` },
    { key: 'totalAmount', title: 'Сумма', render: (order: Order) => formatPrice(order.totalAmount) },
    { 
      key: 'status', 
      title: 'Статус', 
      render: (order: Order) => (
        <Badge variant={getOrderStatusColor(order.status) as 'success' | 'warning' | 'error' | 'info'}>
          {getOrderStatusLabel(order.status)}
        </Badge>
      )
    },
    { 
      key: 'createdAt', 
      title: 'Создан', 
      render: (order: Order) => new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    },
  ];

  if (isWaiter) {
    columns.push({
      key: 'actions',
      title: 'Действия',
      render: (order: Order) => {
        if (!isAdmin && order.createdBy !== authStore.user.username) {
          return '—';
        }
        const nextStatus = getNextStatus(order.status);
        return nextStatus ? (
          <Button size="sm" onClick={() => handleStatusChange(order.id, nextStatus)}>
            {getOrderStatusLabel(nextStatus)}
          </Button>
        ) : '—';
      },
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Заказы</h1>
        {isWaiter && (
          <Button variant="primary" onClick={handleOpenModal}>
            Новый заказ
          </Button>
        )}
      </div>

      <div className={styles.filters}>
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </div>

      {ordersLoading ? (
        <div className={styles.loading}>Загрузка заказов...</div>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.empty}>Заказы не найдены</div>
      ) : (
        <Card className={styles.tableCard}>
          <Table
            columns={columns}
            data={filteredOrders}
            keyField="id"
          />
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Новый заказ"
      >
        <div className={styles.orderForm}>
          <Select
            label="Столик"
            options={activeTables.map(t => ({ value: t.id, label: `Стол ${t.number}` }))}
            value={selectedTableId}
            onChange={(e) => setSelectedTableId(e.target.value)}
          />
          
          <div className={styles.menuSelect}>
            <h4>Выберите позиции:</h4>
            <div className={styles.menuGrid}>
              {filteredMenuItems.filter(m => m.isAvailable).map(item => (
                <button
                  key={item.id}
                  className={styles.menuItem}
                  onClick={() => handleAddItem(item.id, item.price)}
                >
                  <span>{item.name}</span>
                  <span>{formatPrice(item.price)}</span>
                </button>
              ))}
            </div>
          </div>

          {orderItems.length > 0 && (
            <div className={styles.selectedItems}>
              <h4>Выбранные позиции:</h4>
              {orderItems.map(item => {
                const menuItem = filteredMenuItems.find(m => m.id === item.menuItemId);
                return (
                  <div key={item.menuItemId} className={styles.selectedItem}>
                    <span>{menuItem?.name} x{item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                    <Button size="sm" variant="danger" onClick={() => handleRemoveItem(item.menuItemId)}>
                      ✕
                    </Button>
                  </div>
                );
              })}
              <div className={styles.total}>
                <strong>Итого: {formatPrice(orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0))}</strong>
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCreateOrder}
              disabled={!selectedTableId || orderItems.length === 0}
            >
              Создать заказ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
});
