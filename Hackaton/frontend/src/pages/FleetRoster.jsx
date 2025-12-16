import { useState, useEffect } from 'react';
import { assignmentService } from '../services/assignmentService';
import vehicleService from '../services/vehicleService';
import driverService from '../services/driverService';
import './FleetRoster.css';

function FleetRoster() {
  const [assignments, setAssignments] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load current assignments
      const assignmentsData = await assignmentService.getAll();
      setAssignments(assignmentsData);

      // Load available drivers (ACTIVE and not assigned)
      const allDrivers = await driverService.getAll('ACTIVE');
      const assignedDriverIds = assignmentsData.map(a => a.driver_id);
      const unassignedDrivers = allDrivers.filter(d => !assignedDriverIds.includes(d.driver_id));
      setAvailableDrivers(unassignedDrivers);

      // Load available vehicles (ACTIVE and not assigned)
      const allVehicles = await vehicleService.getAll('ACTIVE');
      const assignedVehicleIds = assignmentsData.map(a => a.vehicle_id);
      const unassignedVehicles = allVehicles.filter(v => !assignedVehicleIds.includes(v.vehicle_id));
      setAvailableVehicles(unassignedVehicles);

    } catch (err) {
      setError('Error al cargar los datos de la planilla');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAssignment = async (assignmentId) => {
    if (!window.confirm('¿Está seguro de cerrar esta asignación?')) {
      return;
    }

    try {
      await assignmentService.close(assignmentId);
      loadData();
    } catch (err) {
      setError('Error al cerrar la asignación');
      console.error(err);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    
    if (!selectedDriver || !selectedVehicle) {
      setError('Debe seleccionar un conductor y un vehículo');
      return;
    }

    try {
      await assignmentService.create({
        driver_id: parseInt(selectedDriver),
        vehicle_id: parseInt(selectedVehicle)
      });
      
      setShowAssignModal(false);
      setSelectedDriver('');
      setSelectedVehicle('');
      loadData();
    } catch (err) {
      setError('Error al crear la asignación');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Cargando planilla...</div>;
  }

  return (
    <div className="fleet-roster-container">
      <div className="roster-header">
        <h1>Planilla de Flota</h1>
        <button 
          className="btn-assign"
          onClick={() => setShowAssignModal(true)}
        >
          + Nueva Asignación
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {assignments.length === 0 ? (
        <div className="empty-state">
          <p>No hay asignaciones activas</p>
          <p className="empty-hint">Cree una nueva asignación para comenzar</p>
        </div>
      ) : (
        <div className="roster-table-container">
          <table className="roster-table">
            <thead>
              <tr>
                <th>Conductor</th>
                <th>Licencia</th>
                <th>Vehículo</th>
                <th>Marca/Modelo</th>
                <th>Asignado Desde</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.assignment_id}>
                  <td className="driver-name">{assignment.driver_name}</td>
                  <td className="license-number">{assignment.license_number}</td>
                  <td className="plate-badge">{assignment.vehicle_plate}</td>
                  <td className='de'>{assignment.brand} {assignment.model}</td>
                  <td className='de'>{new Date(assignment.assigned_from).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td>
                  <td>
                    <button
                      className="btn-close-assignment"
                      onClick={() => handleCloseAssignment(assignment.assignment_id)}
                    >
                      Cerrar Asignación
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for new assignment */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Asignación</h2>
            <form onSubmit={handleCreateAssignment}>
              <div className="form-group">
                <label>Conductor:</label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  required
                >
                  <option value="">Seleccione un conductor</option>
                  {availableDrivers.map((driver) => (
                    <option key={driver.driver_id} value={driver.driver_id}>
                      {driver.first_name} {driver.last_name} - Licencia: {driver.license_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Vehículo:</label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  required
                >
                  <option value="">Seleccione un vehículo</option>
                  {availableVehicles.map((vehicle) => (
                    <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                      {vehicle.brand} {vehicle.model} - Placa: {vehicle.plate}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-submit">
                  Crear Asignación
                </button>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FleetRoster;
