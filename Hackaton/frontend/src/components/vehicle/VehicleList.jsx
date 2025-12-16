import { useState } from 'react';
import './VehicleList.css';

const VehicleList = ({ vehicles, onEdit, onChangeStatus, onView }) => {
  const [filterStatus, setFilterStatus] = useState('ALL');

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'badge-active';
      case 'MAINTENANCE':
        return 'badge-maintenance';
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
      case 'MAINTENANCE':
        return 'Mantenimiento';
      case 'INACTIVE':
        return 'Inactivo';
      default:
        return status;
    }
  };

  const filteredVehicles = filterStatus === 'ALL'
    ? vehicles
    : vehicles.filter(v => v.status === filterStatus);

  return (
    <div className="vehicle-list">
      <div className="list-header">
        <h3>Lista de Vehículos ({filteredVehicles.length})</h3>
        <div className="filter-group">
          <label>Filtrar por estado:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Activo</option>
            <option value="MAINTENANCE">Mantenimiento</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </div>
      </div>

      {filteredVehicles.length === 0 ? (
        <div className="empty-state">
          <p>No hay vehículos registrados</p>
        </div>
      ) : (
        <div className="vehicle-grid">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.vehicle_id} className="vehicle-card">
              <div className="vehicle-header">
                <h4 className="vehicle-plate">{vehicle.plate}</h4>
                <span className={`status-badge ${getStatusBadgeClass(vehicle.status)}`}>
                  {getStatusText(vehicle.status)}
                </span>
              </div>
              
              <div className="vehicle-info">
                <div className="info-row">
                  <span className="info-label">Marca:</span>
                  <span className="info-value">{vehicle.brand}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Modelo:</span>
                  <span className="info-value">{vehicle.model}</span>
                </div>
              </div>

              <div className="vehicle-actions">
                {onView && (
                  <button 
                    onClick={() => onView(vehicle)}
                    className="btn-action btn-view"
                  >
                    Ver Detalles
                  </button>
                )}
                {onEdit && (
                  <button 
                    onClick={() => onEdit(vehicle)}
                    className="btn-action btn-edit"
                  >
                    Editar
                  </button>
                )}
                {onChangeStatus && (
                  <button 
                    onClick={() => onChangeStatus(vehicle)}
                    className="btn-action btn-status"
                  >
                    Cambiar Estado
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

export default VehicleList;
