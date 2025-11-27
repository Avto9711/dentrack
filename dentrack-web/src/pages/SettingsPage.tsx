import { useAuth } from '@/context/AuthContext';

export function SettingsPage() {
  const { user } = useAuth();
  return (
    <div className="page-card">
      <div className="page-header">
        <h2>Configuración</h2>
      </div>
      <div className="settings-grid">
        <div className="settings-card">
          <h3>Cuenta</h3>
          <p>Email: {user?.email}</p>
          <p>ID: {user?.id}</p>
        </div>
        <div className="settings-card">
          <h3>Variables requeridas</h3>
          <ul>
            <li><code>VITE_SUPABASE_URL</code></li>
            <li><code>VITE_SUPABASE_ANON_KEY</code></li>
          </ul>
          <p>Estas claves se comparten con la app móvil para garantizar una experiencia consistente.</p>
        </div>
      </div>
    </div>
  );
}
