import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, navigationStore } from '@/store';
import { Card, Button, Input, Select, Modal, Table } from '@/components/UI';
import {
  Category,
  CategoryFormData,
  MenuItem,
  MenuItemFormData,
  Table as TableType,
  TableFormData,
  TableStatus,
  getTableStatusLabel,
} from '@/types';
import styles from './AdminPage.module.scss';
import {
  validateCategoryForm,
  validateMenuItemForm,
  validateTableForm,
} from '@/utils/validators';

type AdminTab = 'menu' | 'categories' | 'tables';
type ModalType = 'category' | 'menu' | 'table' | null;

const TABLE_STATUS_OPTIONS: Array<{ value: TableStatus; label: string }> = [
  { value: 'free', label: 'Свободен' },
  { value: 'occupied', label: 'Занят' },
  { value: 'reserved', label: 'Забронирован' },
  { value: 'maintenance', label: 'Обслуживание' },
];

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
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    createTable,
    updateTable,
    deleteTable,
    getCategoryById,
  } = dataStore;

  const getInitialTab = (): AdminTab => {
    if (currentPage === 'admin-menu') return 'menu';
    if (currentPage === 'admin-categories') return 'categories';
    if (currentPage === 'admin-tables') return 'tables';
    return 'menu';
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(getInitialTab());
  const [modalType, setModalType] = useState<ModalType>(null);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    description: '',
    sortOrder: 0,
  });

  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState<MenuItemFormData>({
    name: '',
    description: '',
    categoryId: '',
    price: 0,
  });

  const [editingTable, setEditingTable] = useState<TableType | null>(null);
  const [tableForm, setTableForm] = useState<TableFormData>({
    number: 0,
    capacity: 4,
    status: 'free',
    location: '',
  });

  const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>({});
  const [menuErrors, setMenuErrors] = useState<Record<string, string>>({});
  const [tableErrors, setTableErrors] = useState<Record<string, string>>({});

  const closeModal = () => {
    setModalType(null);
    setEditingCategory(null);
    setEditingMenuItem(null);
    setEditingTable(null);
    setCategoryErrors({});
    setMenuErrors({});
    setTableErrors({});
  };

  const handleOpenCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        sortOrder: categories.length,
      });
    }
    setCategoryErrors({});
    setModalType('category');
  };

  const handleOpenMenuModal = (item?: MenuItem) => {
    if (item) {
      setEditingMenuItem(item);
      setMenuForm({
        name: item.name,
        description: item.description,
        categoryId: item.categoryId,
        price: item.price,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
      });
    } else {
      setEditingMenuItem(null);
      setMenuForm({
        name: '',
        description: '',
        categoryId: activeCategories[0]?.id || '',
        price: 0,
      });
    }
    setMenuErrors({});
    setModalType('menu');
  };

  const handleOpenTableModal = (table?: TableType) => {
    if (table) {
      setEditingTable(table);
      setTableForm({
        number: table.number,
        capacity: table.capacity,
        status: table.status,
        location: table.location,
      });
    } else {
      setEditingTable(null);
      const activeTables = tables.filter(t => t.isActive);
      const maxNumber = Math.max(0, ...activeTables.map(t => t.number));
      setTableForm({
        number: maxNumber + 1,
        capacity: 4,
        status: 'free',
        location: '',
      });
    }
    setTableErrors({});
    setModalType('table');
  };

  const handleSubmitCategory = async () => {
    const validation = validateCategoryForm(categoryForm);
    if (!validation.valid) {
      setCategoryErrors(validation.errors);
      return;
    }

    setCategoryErrors({});
    const success = editingCategory
      ? await updateCategory(editingCategory.id, categoryForm)
      : await createCategory(categoryForm);

    if (success) {
      closeModal();
    }
  };

  const handleSubmitMenu = async () => {
    const validation = validateMenuItemForm(menuForm);
    if (!validation.valid) {
      setMenuErrors(validation.errors);
      return;
    }

    setMenuErrors({});
    const success = editingMenuItem
      ? await updateMenuItem(editingMenuItem.id, menuForm)
      : await createMenuItem(menuForm);

    if (success) {
      closeModal();
    }
  };

  const handleSubmitTable = async () => {
    const validation = validateTableForm(tableForm);
    if (!validation.valid) {
      setTableErrors(validation.errors);
      return;
    }

    setTableErrors({});
    const success = editingTable
      ? await updateTable(editingTable.id, tableForm)
      : await createTable(tableForm);

    if (success) {
      closeModal();
    }
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="sm" variant="secondary" onClick={() => handleOpenMenuModal(item)}>
            Редактировать
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteMenuItem(item.id)}>
            Удалить
          </Button>
        </div>
      ),
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
          <Button size="sm" variant="secondary" onClick={() => handleOpenCategoryModal(cat)}>
            Редактировать
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteCategory(cat.id)}>
            Удалить
          </Button>
        </div>
      ),
    },
  ];

  const tableColumns = [
    { key: 'number', title: 'Номер', render: (t: TableType) => `Стол ${t.number}` },
    { key: 'capacity', title: 'Вместимость', render: (t: TableType) => `${t.capacity} мест` },
    { key: 'status', title: 'Статус', render: (t: TableType) => getTableStatusLabel(t.status) },
    { key: 'location', title: 'Расположение', render: (t: TableType) => t.location || '-' },
    { key: 'isActive', title: 'Активно', render: (t: TableType) => t.isActive ? 'Да' : 'Нет' },
    {
      key: 'actions',
      title: 'Действия',
      render: (t: TableType) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="sm" variant="secondary" onClick={() => handleOpenTableModal(t)}>
            Редактировать
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteTable(t.id)}>
            Удалить
          </Button>
        </div>
      ),
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
        <>
          <div className={styles.actions}>
            <Button variant="primary" onClick={() => handleOpenMenuModal()}>
              Добавить позицию
            </Button>
          </div>
          <Card className={styles.tableCard}>
            <Table
              columns={menuColumns}
              data={menuItems}
              keyField="id"
            />
          </Card>
        </>
      )}

      {activeTab === 'categories' && (
        <>
          <div className={styles.actions}>
            <Button variant="primary" onClick={() => handleOpenCategoryModal()}>
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
        <>
          <div className={styles.actions}>
            <Button variant="primary" onClick={() => handleOpenTableModal()}>
              Добавить столик
            </Button>
          </div>
          <Card className={styles.tableCard}>
            <Table
              columns={tableColumns}
              data={tables}
              keyField="id"
            />
          </Card>
        </>
      )}

      <Modal
        isOpen={modalType === 'category'}
        onClose={closeModal}
        title={editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}
      >
        <div className={styles.form}>
          <Input
            label="Название"
            value={categoryForm.name}
            onChange={(e) => {
              setCategoryForm({ ...categoryForm, name: e.target.value });
              if (categoryErrors.name) setCategoryErrors({ ...categoryErrors, name: '' });
            }}
            error={categoryErrors.name}
            required
          />
          <Input
            label="Описание"
            value={categoryForm.description || ''}
            onChange={(e) => {
              setCategoryForm({ ...categoryForm, description: e.target.value });
              if (categoryErrors.description) setCategoryErrors({ ...categoryErrors, description: '' });
            }}
            error={categoryErrors.description}
            required
          />
          <Input
            label="Порядок сортировки"
            type="number"
            value={categoryForm.sortOrder || 0}
            onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) || 0 })}
          />
          <div className={styles.formActions}>
            <Button variant="secondary" onClick={closeModal}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSubmitCategory}>
              {editingCategory ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalType === 'menu'}
        onClose={closeModal}
        title={editingMenuItem ? 'Редактировать позицию' : 'Добавить позицию'}
      >
        <div className={styles.form}>
          <Input
            label="Название"
            value={menuForm.name}
            onChange={(e) => {
              setMenuForm({ ...menuForm, name: e.target.value });
              if (menuErrors.name) setMenuErrors({ ...menuErrors, name: '' });
            }}
            error={menuErrors.name}
            required
          />
          <Input
            label="Описание"
            value={menuForm.description}
            onChange={(e) => {
              setMenuForm({ ...menuForm, description: e.target.value });
              if (menuErrors.description) setMenuErrors({ ...menuErrors, description: '' });
            }}
            error={menuErrors.description}
            required
          />
          <Select
            label="Категория"
            options={activeCategories.map(c => ({ value: c.id, label: c.name }))}
            value={menuForm.categoryId}
            onChange={(e) => {
              setMenuForm({ ...menuForm, categoryId: e.target.value });
              if (menuErrors.categoryId) setMenuErrors({ ...menuErrors, categoryId: '' });
            }}
            error={menuErrors.categoryId}
            required
          />
          <Input
            label="Цена (₽)"
            type="number"
            min={0}
            step={0.01}
            value={menuForm.price}
            onChange={(e) => {
              setMenuForm({ ...menuForm, price: parseFloat(e.target.value) || 0 });
              if (menuErrors.price) setMenuErrors({ ...menuErrors, price: '' });
            }}
            error={menuErrors.price}
            required
          />
          <div className={styles.formActions}>
            <Button variant="secondary" onClick={closeModal}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSubmitMenu}>
              {editingMenuItem ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalType === 'table'}
        onClose={closeModal}
        title={editingTable ? 'Редактировать столик' : 'Добавить столик'}
      >
        <div className={styles.form}>
          <Input
            label="Номер столика"
            type="number"
            min={1}
            value={tableForm.number}
            onChange={(e) => {
              setTableForm({ ...tableForm, number: parseInt(e.target.value) || 0 });
              if (tableErrors.number) setTableErrors({ ...tableErrors, number: '' });
            }}
            error={tableErrors.number}
            required
          />
          <Input
            label="Вместимость"
            type="number"
            min={1}
            value={tableForm.capacity}
            onChange={(e) => {
              setTableForm({ ...tableForm, capacity: parseInt(e.target.value) || 0 });
              if (tableErrors.capacity) setTableErrors({ ...tableErrors, capacity: '' });
            }}
            error={tableErrors.capacity}
            required
          />
          <Select
            label="Статус"
            options={TABLE_STATUS_OPTIONS}
            value={tableForm.status || 'free'}
            onChange={(e) => setTableForm({ ...tableForm, status: e.target.value as TableStatus })}
          />
          <Input
            label="Расположение"
            value={tableForm.location || ''}
            onChange={(e) => setTableForm({ ...tableForm, location: e.target.value })}
            placeholder="Например: У окна, Терраса"
          />
          <div className={styles.formActions}>
            <Button variant="secondary" onClick={closeModal}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSubmitTable}>
              {editingTable ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
});
