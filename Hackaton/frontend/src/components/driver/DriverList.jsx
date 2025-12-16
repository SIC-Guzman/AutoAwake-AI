import { useState } from 'react';
import './DriverList.css';

const DriverList = ({ drivers, onEdit, onDeactivate }) => {
  const [filterStatus, setFilterStatus] = useState('ALL');

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'badge-active';
      case 'INACTIVE':
        return 'badge-inactive';
      default:
        return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activo';
      case 'INACTIVE':
        return 'Inactivo';
      default:
        return status;
    }
  };

  const filteredDrivers = filterStatus === 'ALL'
    ? drivers
    : drivers.filter(d => d.status === filterStatus);

  return (
    <div className="driver-list">
      <div className="list-header">
        <h3>Lista de Conductores ({filteredDrivers.length})</h3>
        <div className="filter-group">
          <label>Filtrar por estado:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </div>
      </div>

      {filteredDrivers.length === 0 ? (
        <div className="empty-state">
          <p>No hay conductores registrados</p>
        </div>
      ) : (
        <div className="driver-grid">
          {filteredDrivers.map((driver) => (
            <div key={driver.driver_id} className="driver-card">
              <div className="driver-header">
                <div className="driver-name">
                  <h4>{driver.first_name} {driver.last_name}</h4>
                  <span className={`status-badge ${getStatusBadgeClass(driver.status)}`}>
                    {getStatusText(driver.status)}
                  </span>
                </div>
              </div>
              
              <div className="driver-info">
                <div className="info-row">
                  <span className="info-label">Licencia:</span>
                  <span className="info-value">{driver.license_number}</span>
                </div>
              </div>

              <div className="driver-actions">
                {onEdit && (
                  <button 
                    onClick={() => onEdit(driver)}
                    className="btn-action btn-edit"
                  >
                    Editar
                  </button>
                )}
                {onDeactivate && driver.status === 'ACTIVE' && (
                  <button 
                    onClick={() => onDeactivate(driver)}
                    className="btn-action btn-deactivate"
                  >
                    Desactivar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverList;
