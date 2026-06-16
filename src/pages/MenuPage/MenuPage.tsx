import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore } from '@/store';
import { Card, Input, Select, Badge } from '@/components/UI';
import { formatPrice } from '@/types';
import styles from './MenuPage.module.scss';

export const MenuPage = observer(() => {
  const {
    filteredMenuItems,
    activeCategories,
    menuItemsLoading,
    selectedCategoryId,
    setSelectedCategory,
    setFilter,
    getCategoryById,
  } = dataStore;

  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter('search', searchValue || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, setFilter]);

  const categoryOptions = [
    { value: '', label: 'Все категории' },
    ...activeCategories.map(c => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Меню</h1>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});
