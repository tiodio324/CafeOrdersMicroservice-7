import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { navigationStore, dataStore } from '@/store';
import { MainLayout, LoginModal, ConfirmModal, Toast } from '@/components';
import { HomePage, MenuPage, OrdersPage, TablesPage, AdminPage } from '@/pages';

const PageRouter = observer(() => {
  const { currentPage } = navigationStore;

  switch (currentPage) {
    case 'home':
      return <HomePage />;
    case 'menu':
      return <MenuPage />;
    case 'orders':
      return <OrdersPage />;
    case 'tables':
      return <TablesPage />;
    case 'admin':
    case 'admin-menu':
    case 'admin-categories':
    case 'admin-tables':
      return <AdminPage />;
    default:
      return <HomePage />;
  }
});

const App = observer(() => {
  useEffect(() => {
    dataStore.loadAllData();
  }, []);

  return (
    <>
      <MainLayout>
        <PageRouter />
      </MainLayout>

      <LoginModal />
      <ConfirmModal />
      <Toast />
    </>
  );
});

export default App;
