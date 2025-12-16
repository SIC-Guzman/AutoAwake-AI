import { useState, useEffect } from 'react';
import vehicleService from '../services/vehicleService';
import VehicleForm from '../components/vehicle/VehicleForm';
import VehicleList from '../components/vehicle/VehicleList';
import './Vehicles.css';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await vehicleService.getAll();
      console.log(data);
      setVehicles(data);
    } catch (err) {
      setError(err.message || 'Error al cargar los vehículos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (vehicleData) => {
    try {
      setError('');
      await vehicleService.create(vehicleData);
      setShowForm(false);
      await loadVehicles();
      alert('Vehículo creado exitosamente');
    } catch (err) {
      setError(err.message || 'Error al crear el vehículo');
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleChangeStatus = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setError('');
      await vehicleService.updateStatus(selectedVehicle.vehicle_id, newStatus);
      setShowStatusModal(false);
      setSelectedVehicle(null);
      await loadVehicles();
      alert('Estado actualizado exitosamente');
    } catch (err) {
      setError(err.message || 'Error al actualizar el estado');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingVehicle(null);
  };

  return (
    <div className="vehicles-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Gestión de Vehículos</h1>
          <p>Administra la flota de vehículos del sistema</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          + Nuevo Vehículo
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {showForm && (
        <div className="form-section">
          <div className="form-header">
            <h2>{editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h2>
          </div>
          <VehicleForm
            onSubmit={handleCreateVehicle}
            onCancel={handleCancelForm}
            initialData={editingVehicle}
          />
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando vehículos...</p>
        </div>
      ) : (
        <VehicleList
          vehicles={vehicles}
          onEdit={handleEdit}
          onChangeStatus={handleChangeStatus}
        />
      )}

      {showStatusModal && selectedVehicle && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cambiar Estado del Vehículo</h3>
            <p className="modal-subtitle">
              Vehículo: <strong>{selectedVehicle.plate}</strong>
            </p>
            <p className="modal-subtitle">
              Estado actual: <strong>{selectedVehicle.status}</strong>
            </p>
            
            <div className="status-options">
              <button
                onClick={() => handleStatusUpdate('ACTIVE')}
                className="status-btn status-active"
                disabled={selectedVehicle.status === 'ACTIVE'}
              >
                Activo
              </button>
              <button
                onClick={() => handleStatusUpdate('MAINTENANCE')}
                className="status-btn status-maintenance"
                disabled={selectedVehicle.status === 'MAINTENANCE'}
              >
                Mantenimiento
              </button>
              <button
                onClick={() => handleStatusUpdate('INACTIVE')}
                className="status-btn status-inactive"
                disabled={selectedVehicle.status === 'INACTIVE'}
              >
                Inactivo
              </button>
            </div>

            <button
              onClick={() => setShowStatusModal(false)}
              className="btn-close-modal"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
