import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore } from '@/store';
import { Card, Button, Input, Select, Badge, Modal } from '@/components/UI';
import { formatPrice, MenuItem, MenuItemFormData } from '@/types';
import styles from './MenuPage.module.scss';

export const MenuPage = observer(() => {
  const { 
    filteredMenuItems, 
    activeCategories, 
    menuItemsLoading,
    selectedCategoryId,
    setSelectedCategory,
    setFilter,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getCategoryById
  } = dataStore;
  const { isAdmin } = authStore;
  
  const [searchValue, setSearchValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: '',
    description: '',
    categoryId: '',
    price: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter('search', searchValue || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, setFilter]);

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        categoryId: item.categoryId,
        price: item.price,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        categoryId: activeCategories[0]?.id || '',
        price: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async () => {
    if (editingItem) {
      await updateMenuItem(editingItem.id, formData);
    } else {
      await createMenuItem(formData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту позицию?')) {
      await deleteMenuItem(id);
    }
  };

  const categoryOptions = [
    { value: '', label: 'Все категории' },
    ...activeCategories.map(c => ({ value: c.id, label: c.name }))
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Меню</h1>
        {isAdmin && (
          <Button variant="primary" onClick={() => handleOpenModal()}>
            Добавить позицию
          </Button>
        )}
      </div>

      <div className={styles.filters}>
        <Input
          placeholder="Поиск по названию..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className={styles.searchInput}
        />
        <Select
          options={categoryOptions}
          value={selectedCategoryId || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className={styles.categorySelect}
        />
      </div>

      {menuItemsLoading ? (
        <div className={styles.loading}>Загрузка меню...</div>
      ) : filteredMenuItems.length === 0 ? (
        <div className={styles.empty}>Позиции не найдены</div>
      ) : (
        <div className={styles.grid}>
          {filteredMenuItems.map(item => (
            <Card key={item.id} className={styles.menuCard}>
              <div className={styles.menuCardHeader}>
                <h3 className={styles.menuName}>{item.name}</h3>
                <Badge variant={item.isAvailable ? 'success' : 'error'}>
                  {item.isAvailable ? 'Доступно' : 'Нет в наличии'}
                </Badge>
              </div>
              <p className={styles.menuDescription}>{item.description}</p>
              <div className={styles.menuMeta}>
                <span className={styles.category}>
                  {getCategoryById(item.categoryId)?.name || 'Без категории'}
                </span>
                <span className={styles.price}>{formatPrice(item.price)}</span>
              </div>
              {isAdmin && (
                <div className={styles.menuActions}>
                  <Button size="sm" variant="secondary" onClick={() => handleOpenModal(item)}>
                    Редактировать
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>
                    Удалить
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Редактировать позицию' : 'Добавить позицию'}
      >
        <div className={styles.form}>
          <Input
            label="Название"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Описание"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Select
            label="Категория"
            options={activeCategories.map(c => ({ value: c.id, label: c.name }))}
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            required
          />
          <Input
            label="Цена (₽)"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            required
          />
          <div className={styles.formActions}>
            <Button variant="secondary" onClick={handleCloseModal}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingItem ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
});
