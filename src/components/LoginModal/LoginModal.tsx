import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '@/store';
import { UserRole } from '@/types';
import { Modal, Input, Button } from '@/components/UI';
import styles from './LoginModal.module.scss';

export const LoginModal = observer(() => {
  const { loginModalOpen, closeLoginModal, login, loginError, isLoading } = authStore;
  const [selectedRole, setSelectedRole] = useState<Exclude<UserRole, 'guest'>>('waiter');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(selectedRole, password, selectedRole === 'waiter' ? username : undefined);
  };

  const handleClose = () => {
    closeLoginModal();
    setUsername('');
    setPassword('');
    setSelectedRole('waiter');
  };

  const handleRoleChange = (role: Exclude<UserRole, 'guest'>) => {
    setSelectedRole(role);
    setUsername('');
    setPassword('');
  };

  return (
    <Modal
      isOpen={loginModalOpen}
      onClose={handleClose}
      title="Вход в систему"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.roleSelector}>
          <button
            type="button"
            className={`${styles.roleButton} ${selectedRole === 'waiter' ? styles.active : ''}`}
            onClick={() => handleRoleChange('waiter')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span>Официант</span>
          </button>
          <button
            type="button"
            className={`${styles.roleButton} ${selectedRole === 'admin' ? styles.active : ''}`}
            onClick={() => handleRoleChange('admin')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            <span>Администратор</span>
          </button>
        </div>

        {selectedRole === 'waiter' && (
          <Input
            label="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Введите логин официанта"
            error={loginError || undefined}
            disabled={isLoading}
            autoFocus
          />
        )}

        <Input
          type="password"
          label="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Введите пароль"
          error={selectedRole === 'admin' ? loginError || undefined : undefined}
          disabled={isLoading}
          autoFocus={selectedRole === 'admin'}
        />

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !password || (selectedRole === 'waiter' && !username.trim())}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>
        </div>
      </form>
    </Modal>
  );
});
