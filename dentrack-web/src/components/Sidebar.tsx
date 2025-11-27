import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const routes = [
  { to: '/', label: 'Dashboard' },
  { to: '/patients', label: 'Pacientes' },
  { to: '/doctors', label: 'Doctores' },
  { to: '/treatments', label: 'Tratamientos' },
  { to: '/appointments', label: 'Citas' },
  { to: '/budgets', label: 'Presupuestos' },
  { to: '/clinics', label: 'Clínicas' },
  { to: '/settings', label: 'Configuración' },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">🦷</span>
        <strong>Dentrack Admin</strong>
      </div>
      <nav>
        {routes.map((route) => (
          <NavLink key={route.to} to={route.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            {route.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
