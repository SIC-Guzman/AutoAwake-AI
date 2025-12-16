import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    total_vehicles: 0,
    alerts_24h: 0,
    active_trips: 0,
    total_drivers: 0
  });
  const [topDrowsyVehicles, setTopDrowsyVehicles] = useState([]);
  const [alertsByDay, setAlertsByDay] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsData, drowsyData, alertsData, recentData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getTopDrowsyVehicles(5),
        dashboardService.getAlertsByDay(7),
        dashboardService.getRecentAlerts(5)
      ]);

      setStats(statsData);
      setTopDrowsyVehicles(drowsyData);
      setAlertsByDay(alertsData);
      setRecentAlerts(recentData);
    } catch (err) {
      setError('Error al cargar los datos del dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'HIGH':
        return 'severity-high';
      case 'MEDIUM':
        return 'severity-medium';
      case 'LOW':
        return 'severity-low';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && stats.total_vehicles === 0) {
    return <div className="loading">Cargando dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard de Flota</h1>
        <p className="dashboard-subtitle">Panel de control y monitoreo en tiempo real</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon vehicles">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.total_vehicles}</h3>
            <p className="stat-label">Vehículos Activos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon alerts">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.alerts_24h}</h3>
            <p className="stat-label">Alertas (24h)</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon trips">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.active_trips}</h3>
            <p className="stat-label">Viajes Activos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon drivers">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.total_drivers}</h3>
            <p className="stat-label">Conductores Activos</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Top Drowsy Vehicles */}
        <div className="dashboard-panel">
          <h2 className="panel-title">Vehículos con Más Alertas de Somnolencia</h2>
          <p className="panel-subtitle">Últimos 7 días</p>
          {topDrowsyVehicles.length === 0 ? (
            <p className="empty-message">No hay alertas de somnolencia registradas</p>
          ) : (
            <div className="drowsy-list">
              {topDrowsyVehicles.map((vehicle, index) => (
                <div key={vehicle.vehicle_id} className="drowsy-item">
                  <div className="drowsy-rank">{index + 1}</div>
                  <div className="drowsy-info">
                    <p className="drowsy-plate">{vehicle.plate}</p>
                    <p className="drowsy-model">{vehicle.brand} {vehicle.model}</p>
                  </div>
                  <div className="drowsy-count">
                    <span className="count-badge">{vehicle.alert_count}</span>
                    <span className="count-label">alertas</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts Chart */}
        <div className="dashboard-panel">
          <h2 className="panel-title">Alertas por Día</h2>
          <p className="panel-subtitle">Últimos 7 días</p>
          {alertsByDay.length === 0 ? (
            <p className="empty-message">No hay alertas registradas</p>
          ) : (
            <div className="chart-container">
              <div className="bar-chart">
                {alertsByDay.map((day) => (
                  <div key={day.date} className="bar-group">
                    <div className="bar-wrapper">
                      <div 
                        className="bar"
                        style={{ 
                          height: `${Math.max((day.count / Math.max(...alertsByDay.map(d => d.count))) * 100, 5)}%` 
                        }}
                      >
                        <span className="bar-value">{day.count}</span>
                      </div>
                    </div>
                    <span className="bar-label">{formatDate(day.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="dashboard-panel full-width">
          <h2 className="panel-title">Alertas Recientes</h2>
          <p className="panel-subtitle">Últimas 5 alertas registradas</p>
          {recentAlerts.length === 0 ? (
            <p className="empty-message">No hay alertas recientes</p>
          ) : (
            <div className="alerts-table">
              <table>
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Vehículo</th>
                    <th>Conductor</th>
                    <th>Tipo</th>
                    <th>Severidad</th>
                    <th>Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAlerts.map((alert) => (
                    <tr key={alert.alert_id}>
                      <td>{formatDateTime(alert.detected_at)}</td>
                      <td className="vehicle-cell">{alert.vehicle_plate}</td>
                      <td>{alert.driver_name}</td>
                      <td>{alert.alert_type}</td>
                      <td>
                        <span className={`severity-badge ${getSeverityClass(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="message-cell">{alert.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
