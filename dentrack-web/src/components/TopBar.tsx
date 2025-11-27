import { useAuth } from '@/context/AuthContext';
import './TopBar.css';

export function TopBar() {
  const { user, signOut } = useAuth();

  return (
    <header className="topbar">
      <div>
        <h1>Panel administrativo</h1>
        <p className="topbar__subtitle">Administra pacientes, doctores, citas y más.</p>
      </div>
      <div className="topbar__actions">
        <span className="topbar__user">{user?.email}</span>
        <button type="button" onClick={signOut} className="ghost-button">
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
