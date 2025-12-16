import { Outlet, Navigate } from 'react-router-dom';
import authService from '../services/authService';
import './Layout.css';

const Layout = () => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <h2>AutoAwake AI</h2>
        </div>
        <div className="navbar-menu">
          <a href="/dashboard" className="nav-link">Dashboard</a>
          <a href="/vehicles" className="nav-link">Vehículos</a>
          <a href="/drivers" className="nav-link">Conductores</a>
          <a href="/fleet" className="nav-link">Planilla</a>
          <a href="/trips" className="nav-link">Viajes</a>
          <a href="/alerts" className="nav-link">Alertas</a>
          <a href="/reports" className="nav-link">Reportes</a>
        </div>
        <div className="navbar-user">
          <span className="user-name">{user?.name || user?.email}</span>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
