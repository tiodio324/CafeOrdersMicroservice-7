import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import { navigationStore, dataStore, authStore } from '@/store';
import { MainLayout, LoginModal, ConfirmModal, Toast } from '@/components';
import { HomePage, MenuPage, OrdersPage, TablesPage, AdminPage } from '@/pages';

const PageRouter = observer(() => {
  const { currentPage } = navigationStore;
  const { canAccessAdmin } = authStore;

  useEffect(() => {
    navigationStore.ensureAuthorizedPage();
  }, [currentPage]);

  useEffect(() => {
    const disposer = reaction(
      () => authStore.isAuthenticated,
      () => navigationStore.ensureAuthorizedPage(),
    );
    return disposer;
  }, []);

  const isAdminPage = currentPage === 'admin'
    || currentPage === 'admin-menu'
    || currentPage === 'admin-categories'
    || currentPage === 'admin-tables'
    || currentPage === 'admin-employees';

  if (isAdminPage && !canAccessAdmin()) {
    return <HomePage />;
  }

  if (!navigationStore.canAccessPage(currentPage)) {
    return authStore.canViewMenu() ? <MenuPage /> : <HomePage />;
  }

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
    case 'admin-employees':
      return <AdminPage />;
    default:
      return <HomePage />;
  }
});

const App = observer(() => {
  useEffect(() => {
    dataStore.loadAllData();
    authStore.loadWaiterAccounts();
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
