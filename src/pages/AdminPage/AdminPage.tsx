import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, navigationStore, authStore } from '@/store';
import { WaiterAccountView } from '@/store/AuthStore';
import { Card, Button, Input, Select, Modal, Table, Badge } from '@/components/UI';
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

type AdminTab = 'menu' | 'categories' | 'tables' | 'employees';
type ModalType = 'category' | 'menu' | 'table' | 'employee' | null;

interface EmployeeFormData {
  displayName: string;
  username: string;
  password: string;
}

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

  const { waiterAccounts, registerWaiterAccount, deleteWaiterAccount } = authStore;

  const getInitialTab = (): AdminTab => {
    if (currentPage === 'admin-menu') return 'menu';
    if (currentPage === 'admin-categories') return 'categories';
    if (currentPage === 'admin-tables') return 'tables';
    if (currentPage === 'admin-employees') return 'employees';
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

  const [employeeForm, setEmployeeForm] = useState<EmployeeFormData>({
    displayName: '',
    username: '',
    password: '',
  });
  const [employeeSubmitting, setEmployeeSubmitting] = useState(false);

  const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>({});
  const [menuErrors, setMenuErrors] = useState<Record<string, string>>({});
  const [tableErrors, setTableErrors] = useState<Record<string, string>>({});
  const [employeeErrors, setEmployeeErrors] = useState<Record<string, string>>({});

  const closeModal = () => {
    setModalType(null);
    setEditingCategory(null);
    setEditingMenuItem(null);
    setEditingTable(null);
    setCategoryErrors({});
    setMenuErrors({});
    setTableErrors({});
    setEmployeeErrors({});
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

  const handleOpenEmployeeModal = () => {
    setEmployeeForm({ displayName: '', username: '', password: '' });
    setEmployeeErrors({});
    setModalType('employee');
  };

  const handleSubmitEmployee = async () => {
    const errors: Record<string, string> = {};
    if (!employeeForm.displayName.trim()) errors.displayName = 'Введите имя сотрудника';
    if (!employeeForm.username.trim()) errors.username = 'Введите логин';
    if (!employeeForm.password.trim()) errors.password = 'Введите пароль';

    if (Object.keys(errors).length > 0) {
      setEmployeeErrors(errors);
      return;
    }

    setEmployeeErrors({});
    setEmployeeSubmitting(true);
    const result = await registerWaiterAccount(employeeForm);
    setEmployeeSubmitting(false);

    if (result.ok) {
      closeModal();
    } else {
      setEmployeeErrors({ form: result.error });
    }
  };

  const handleDeleteEmployee = async (account: WaiterAccountView) => {
    if (account.isBuiltIn) return;
    if (confirm(`Удалить сотрудника «${account.displayName}»? Учётная запись будет деактивирована безвозвратно.`)) {
      await deleteWaiterAccount(account.id);
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

  const employeeColumns = [
    { key: 'displayName', title: 'Имя' },
    {
      key: 'username',
      title: 'Логин',
      render: (account: WaiterAccountView) => <code className={styles.code}>{account.username}</code>,
    },
    {
      key: 'password',
      title: 'Пароль',
      render: (account: WaiterAccountView) => <code className={styles.code}>{account.password}</code>,
    },
    {
      key: 'type',
      title: 'Тип учётной записи',
      render: (account: WaiterAccountView) =>
        account.isBuiltIn ? (
          <Badge variant="info">Встроенная</Badge>
        ) : (
          <Badge variant="success">Зарегистрирована</Badge>
        ),
    },
    {
      key: 'actions',
      title: 'Действия',
      render: (account: WaiterAccountView) =>
        account.isBuiltIn ? (
          <span className={styles.mutedNote} title="Системная учётная запись, входит в базовую поставку системы">
            Системный аккаунт
          </span>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="danger" onClick={() => handleDeleteEmployee(account)}>
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
        <button
          className={`${styles.tab} ${activeTab === 'employees' ? styles.active : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          Сотрудники ({waiterAccounts.length})
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
              data={menuItems.filter(m => m.isActive)}
              keyField="id"
              emptyText="Позиции меню пока не добавлены"
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
              data={activeCategories}
              keyField="id"
              emptyText="Категории пока не добавлены"
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
              data={tables.filter(t => t.isActive)}
              keyField="id"
              emptyText="Столики пока не добавлены"
            />
          </Card>
        </>
      )}

      {activeTab === 'employees' && (
        <>
          <div className={styles.actions}>
            <Button variant="primary" onClick={handleOpenEmployeeModal}>
              Новый сотрудник
            </Button>
          </div>
          <Card className={styles.tableCard}>
            <Table
              columns={employeeColumns}
              data={waiterAccounts}
              keyField="id"
              loading={authStore.waiterAccountsLoading}
              emptyText="Сотрудники пока не добавлены"
            />
          </Card>
          <p className={styles.hintText}>
            Встроенные учётные записи входят в базовую поставку системы и не могут быть удалены.
          </p>
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

      <Modal
        isOpen={modalType === 'employee'}
        onClose={closeModal}
        title="Регистрация нового сотрудника"
      >
        <div className={styles.form}>
          <p className={styles.modalIntro}>
            Заполните данные сотрудника. Учётная запись будет создана в системе,
            после чего официант сможет входить под выданными логином и паролем.
          </p>
          <Input
            label="Имя"
            value={employeeForm.displayName}
            onChange={(e) => {
              setEmployeeForm({ ...employeeForm, displayName: e.target.value });
              if (employeeErrors.displayName || employeeErrors.form) {
                setEmployeeErrors({ ...employeeErrors, displayName: '', form: '' });
              }
            }}
            error={employeeErrors.displayName}
            placeholder="Например: Мария Сидорова"
            required
          />
          <Input
            label="Логин"
            value={employeeForm.username}
            onChange={(e) => {
              setEmployeeForm({ ...employeeForm, username: e.target.value });
              if (employeeErrors.username || employeeErrors.form) {
                setEmployeeErrors({ ...employeeErrors, username: '', form: '' });
              }
            }}
            error={employeeErrors.username}
            placeholder="Например: maria"
            autoComplete="off"
            required
          />
          <Input
            label="Пароль"
            value={employeeForm.password}
            onChange={(e) => {
              setEmployeeForm({ ...employeeForm, password: e.target.value });
              if (employeeErrors.password || employeeErrors.form) {
                setEmployeeErrors({ ...employeeErrors, password: '', form: '' });
              }
            }}
            error={employeeErrors.password}
            placeholder="Минимум 4 символа"
            autoComplete="new-password"
            required
          />
          {employeeErrors.form && <p className={styles.formError}>{employeeErrors.form}</p>}
          <div className={styles.formActions}>
            <Button variant="secondary" onClick={closeModal} disabled={employeeSubmitting}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSubmitEmployee} disabled={employeeSubmitting}>
              {employeeSubmitting ? 'Регистрация...' : 'Зарегистрировать'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
});
