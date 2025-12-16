import { useState, useEffect } from 'react';
import driverService from '../services/driverService';
import DriverForm from '../components/driver/DriverForm';
import DriverList from '../components/driver/DriverList';
import './Drivers.css';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await driverService.getAll();
      setDrivers(data);
    } catch (err) {
      setError(err.message || 'Error al cargar los conductores');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDriver = async (driverData) => {
    try {
      setError('');
      if (editingDriver) {
        // Actualizar conductor existente
        await driverService.update(editingDriver.driver_id, driverData);
        alert('Conductor actualizado exitosamente');
      } else {
        // Crear nuevo conductor
        await driverService.create(driverData);
        alert('Conductor creado exitosamente');
      }
      setShowForm(false);
      setEditingDriver(null);
      await loadDrivers();
    } catch (err) {
      setError(err.message || 'Error al guardar el conductor');
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setShowForm(true);
  };

  const handleDeactivate = async (driver) => {
    if (!confirm(`¿Estás seguro de desactivar a ${driver.first_name} ${driver.last_name}?`)) {
      return;
    }

    try {
      setError('');
      await driverService.deactivate(driver.driver_id);
      await loadDrivers();
      alert('Conductor desactivado exitosamente');
    } catch (err) {
      setError(err.message || 'Error al desactivar el conductor');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingDriver(null);
  };

  return (
    <div className="drivers-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Gestión de Conductores</h1>
          <p>Administra los conductores del sistema</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          + Nuevo Conductor
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
            <h2>{editingDriver ? 'Editar Conductor' : 'Nuevo Conductor'}</h2>
          </div>
          <DriverForm
            onSubmit={handleCreateDriver}
            onCancel={handleCancelForm}
            initialData={editingDriver}
          />
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando conductores...</p>
        </div>
      ) : (
        <DriverList
          drivers={drivers}
          onEdit={handleEdit}
          onDeactivate={handleDeactivate}
        />
      )}
    </div>
  );
};

export default Drivers;
