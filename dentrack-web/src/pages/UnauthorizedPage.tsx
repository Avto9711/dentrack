import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function UnauthorizedPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1>401</h1>
        <p className="topbar__subtitle">No tienes permiso para acceder a este panel.</p>
        <button className="primary-button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
