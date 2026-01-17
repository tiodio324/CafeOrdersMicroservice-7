import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, navigationStore } from '@/store';
import { Card, Button, Input, Modal, Table } from '@/components/UI';
import { Category, CategoryFormData, MenuItem, Table as TableType } from '@/types';
import styles from './AdminPage.module.scss';

type AdminTab = 'menu' | 'categories' | 'tables';

export const AdminPage = observer(() => {
  const { currentPage } = navigationStore;
  const { 
    menuItems, 
    categories, 
    tables,
    activeCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    deleteMenuItem,
    deleteTable,
    getCategoryById
  } = dataStore;
  
  const getInitialTab = (): AdminTab => {
    if (currentPage === 'admin-menu') return 'menu';
    if (currentPage === 'admin-categories') return 'categories';
    if (currentPage === 'admin-tables') return 'tables';
    return 'menu';
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(getInitialTab());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    sortOrder: 0,
  });

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        sortOrder: categories.length,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async () => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, formData);
    } else {
      await createCategory(formData);
    }
    handleCloseModal();
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту категорию?')) {
      await deleteCategory(id);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту позицию меню?')) {
      await deleteMenuItem(id);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот столик?')) {
      await deleteTable(id);
    }
  };

  const menuColumns = [
    { key: 'name', title: 'Название' },
    { key: 'categoryId', title: 'Категория', render: (item: MenuItem) => getCategoryById(item.categoryId)?.name || '-' },
    { key: 'price', title: 'Цена', render: (item: MenuItem) => `${item.price} ₽` },
    { key: 'isAvailable', title: 'Доступно', render: (item: MenuItem) => item.isAvailable ? 'Да' : 'Нет' },
    { key: 'isActive', title: 'Активно', render: (item: MenuItem) => item.isActive ? 'Да' : 'Нет' },
    { 
      key: 'actions', 
      title: 'Действия',
      render: (item: MenuItem) => (
        <Button size="sm" variant="danger" onClick={() => handleDeleteMenuItem(item.id)}>
          Удалить
        </Button>
      )
    },
  ];

  const categoryColumns = [
    { key: 'name', title: 'Название' },
    { key: 'description', title: 'Описание', render: (cat: Category) => cat.description || '-' },
    { key: 'sortOrder', title: 'Порядок' },
    { key: 'isActive', title: 'Активно', render: (cat: Category) => cat.isActive ? 'Да' : 'Нет' },
    { 
      key: 'actions', 
      title: 'Действия',
      render: (cat: Category) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="sm" variant="secondary" onClick={() => handleOpenModal(cat)}>
            Редактировать
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteCategory(cat.id)}>
            Удалить
          </Button>
        </div>
      )
    },
  ];

  const tableColumns = [
    { key: 'number', title: 'Номер', render: (t: TableType) => `Стол ${t.number}` },
    { key: 'capacity', title: 'Вместимость', render: (t: TableType) => `${t.capacity} мест` },
    { key: 'status', title: 'Статус' },
    { key: 'location', title: 'Расположение', render: (t: TableType) => t.location || '-' },
    { key: 'isActive', title: 'Активно', render: (t: TableType) => t.isActive ? 'Да' : 'Нет' },
    { 
      key: 'actions', 
      title: 'Действия',
      render: (t: TableType) => (
        <Button size="sm" variant="danger" onClick={() => handleDeleteTable(t.id)}>
          Удалить
        </Button>
      )
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Администрирование</h1>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'menu' ? styles.active : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          Меню ({menuItems.filter(m => m.isActive).length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'categories' ? styles.active : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Категории ({activeCategories.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'tables' ? styles.active : ''}`}
          onClick={() => setActiveTab('tables')}
        >
          Столики ({tables.filter(t => t.isActive).length})
        </button>
      </div>

      {activeTab === 'menu' && (
        <Card className={styles.tableCard}>
          <Table
            columns={menuColumns}
            data={menuItems}
            keyField="id"
          />
        </Card>
      )}

      {activeTab === 'categories' && (
        <>
          <div className={styles.actions}>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              Добавить категорию
            </Button>
          </div>
          <Card className={styles.tableCard}>
            <Table
              columns={categoryColumns}
              data={categories}
              keyField="id"
            />
          </Card>
        </>
      )}

      {activeTab === 'tables' && (
        <Card className={styles.tableCard}>
          <Table
            columns={tableColumns}
            data={tables}
            keyField="id"
          />
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}
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
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Input
            label="Порядок сортировки"
            type="number"
            value={formData.sortOrder || 0}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
          />
          <div className={styles.formActions}>
            <Button variant="secondary" onClick={handleCloseModal}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingCategory ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
});
