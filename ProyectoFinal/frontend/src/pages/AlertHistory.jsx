import { useState, useEffect } from 'react';
import alertService from '../services/alertService';
import driverService from '../services/driverService';
import vehicleService from '../services/vehicleService';
import './AlertHistory.css';

function AlertHistory() {
  const [alerts, setAlerts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtros
  const [filters, setFilters] = useState({
    driver_id: '',
    vehicle_id: '',
    start_date: '',
    limit: 100
  });

  useEffect(() => {
    loadDriversAndVehicles();
    loadAlerts();
  }, []);

  const loadDriversAndVehicles = async () => {
    try {
      const [driversData, vehiclesData] = await Promise.all([
        driverService.getAll(),
        vehicleService.getAll()
      ]);
      setDrivers(driversData);
      setVehicles(vehiclesData);
    } catch (err) {
      console.error('Error loading drivers/vehicles:', err);
    }
  };

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const filterParams = {};
      if (filters.driver_id) filterParams.driver_id = parseInt(filters.driver_id);
      if (filters.vehicle_id) filterParams.vehicle_id = parseInt(filters.vehicle_id);
      if (filters.start_date) filterParams.start_date = filters.start_date;
      if (filters.limit) filterParams.limit = parseInt(filters.limit);

      const data = await alertService.getAll(filterParams);
      console.log('Alerts data received:', data);
      setAlerts(data);
    } catch (err) {
      setError('Error al cargar el historial de alertas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    loadAlerts();
  };

  const handleClearFilters = () => {
    setFilters({
      driver_id: '',
      vehicle_id: '',
      start_date: '',
      limit: 100
    });
    setTimeout(() => loadAlerts(), 100);
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'severity-critical';
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

  const getSeverityText = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'Crítica';
      case 'HIGH':
        return 'Alta';
      case 'MEDIUM':
        return 'Media';
      case 'LOW':
        return 'Baja';
      default:
        return severity;
    }
  };

  return (
    <div className="alert-history-container">
      <div className="page-header">
        <h1>Historial de Alertas de Somnolencia</h1>
        <p>Consulta y filtra las alertas registradas en el sistema</p>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <h2>Filtros de Búsqueda</h2>
        <form onSubmit={handleApplyFilters} className="filters-form">
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="driver_id">Conductor</label>
              <select
                id="driver_id"
                name="driver_id"
                value={filters.driver_id}
                onChange={handleFilterChange}
              >
                <option value="">Todos los conductores</option>
                {drivers.map((driver) => (
                  <option key={driver.driver_id} value={driver.driver_id}>
                    {driver.first_name} {driver.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="vehicle_id">Vehículo</label>
              <select
                id="vehicle_id"
                name="vehicle_id"
                value={filters.vehicle_id}
                onChange={handleFilterChange}
              >
                <option value="">Todos los vehículos</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                    {vehicle.plate} - {vehicle.brand} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="start_date">Fecha Inicio</label>
              <input
                type="datetime-local"
                id="start_date"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="limit">Límite</label>
              <select
                id="limit"
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
              >
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="500">500</option>
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button type="submit" className="btn-apply">
              Aplicar Filtros
            </button>
            <button type="button" className="btn-clear" onClick={handleClearFilters}>
              Limpiar Filtros
            </button>
          </div>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Resultados */}
      <div className="results-section">
        <div className="results-header">
          <h2>Resultados</h2>
          <span className="results-count">
            {loading ? 'Cargando...' : `${alerts.length} alertas encontradas`}
          </span>
        </div>

        {loading ? (
          <div className="loading-state">Cargando alertas...</div>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron alertas con los filtros aplicados</p>
          </div>
        ) : (
          <div className="alerts-table-container">
            <table className="alerts-table">
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Conductor</th>
                  <th>Vehículo</th>
                  <th>Tipo</th>
                  <th>Severidad</th>
                  <th>Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.alert_id}>
                    <td className="alert-date">
                      {new Date(alert.detected_at).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td>
                      <span className="driver-name">
                        {alert.driver_name || `Driver #${alert.driver_id}`}
                      </span>
                    </td>
                    <td>
                      <span className="vehicle-plate">
                        {alert.vehicle_plate || `Vehicle #${alert.vehicle_id}`}
                      </span>
                    </td>
                    <td className="alert-type">{alert.alert_type}</td>
                    <td>
                      <span className={`severity-badge ${getSeverityClass(alert.severity)}`}>
                        {getSeverityText(alert.severity)}
                      </span>
                    </td>
                    <td className="alert-message">{alert.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertHistory;
