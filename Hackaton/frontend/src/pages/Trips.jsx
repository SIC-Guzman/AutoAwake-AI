import { useState, useEffect } from 'react';
import tripService from '../services/tripService';
import { assignmentService } from '../services/assignmentService';
import issueService from '../services/issueService';
import './Trips.css';

function Trips() {
  const [trips, setTrips] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' o 'completed'
  
  // Form data para crear viaje
  const [newTrip, setNewTrip] = useState({
    assignment_id: '',
    origin: '',
    destination: ''
  });

  useEffect(() => {
    loadTrips();
    loadAssignments();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      setError('');
      
      const allTrips = await tripService.getAll();
      setTrips(allTrips);
      
      // Separar viajes activos y completados
      const active = allTrips.filter(t => t.status === 'IN_PROGRESS');
      const completed = allTrips.filter(t => t.status !== 'IN_PROGRESS');
      
      setActiveTrips(active);
      setCompletedTrips(completed);
      
    } catch (err) {
      setError('Error al cargar los viajes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const data = await assignmentService.getAll();
      setAssignments(data);
    } catch (err) {
      console.error('Error loading assignments:', err);
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    
    if (!newTrip.assignment_id || !newTrip.origin || !newTrip.destination) {
      setError('Todos los campos son requeridos');
      return;
    }

    try {
      const assignment = assignments.find(a => a.assignment_id === parseInt(newTrip.assignment_id));
      
      const tripData = {
        vehicle_id: assignment.vehicle_id,
        driver_id: assignment.driver_id,
        origin: newTrip.origin,
        destination: newTrip.destination
      };

      await tripService.create(tripData);
      
      setShowCreateModal(false);
      setNewTrip({ assignment_id: '', origin: '', destination: '' });
      loadTrips();
    } catch (err) {
      setError('Error al crear el viaje');
      console.error(err);
    }
  };

  const handleEndTrip = async (tripId) => {
    if (!window.confirm('¿Está seguro de finalizar este viaje?')) {
      return;
    }

    try {
      await tripService.end(tripId, 'COMPLETED');
      loadTrips();
    } catch (err) {
      setError('Error al finalizar el viaje');
      console.error(err);
    }
  };

  const handleViewDetails = (trip) => {
    setSelectedTrip(trip);
    setShowDetailModal(true);
  };

  return (
    <div className="trips-container">
      <div className="trips-header">
        <h1>Gestión de Viajes</h1>
        <button 
          className="btn-create-trip"
          onClick={() => setShowCreateModal(true)}
        >
          + Iniciar Nuevo Viaje
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Tabs para viajes activos y completados */}
      <div className="trips-tabs">
        <button 
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Viajes Activos ({activeTrips.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Viajes Completados ({completedTrips.length})
        </button>
      </div>

      {/* Lista de viajes */}
      <div className="trips-list">
        {loading ? (
          <div className="loading">Cargando viajes...</div>
        ) : (activeTab === 'active' ? activeTrips : completedTrips).length === 0 ? (
          <div className="empty-state">
            <p>No hay viajes {activeTab === 'active' ? 'activos' : 'completados'}</p>
            <p className="empty-hint">
              {activeTab === 'active' ? 'Inicie un nuevo viaje para comenzar' : 'No hay viajes finalizados'}
            </p>
          </div>
        ) : (
          <div className="trips-grid">
            {(activeTab === 'active' ? activeTrips : completedTrips).map((trip) => (
              <div key={trip.trip_id} className="trip-card">
                <div className="trip-card-header">
                  <span className={`trip-status status-${trip.status.toLowerCase()}`}>
                    {trip.status === 'IN_PROGRESS' ? 'EN PROGRESO' : trip.status === 'COMPLETED' ? 'COMPLETADO' : 'CANCELADO'}
                  </span>
                  <div className="header-actions">
                    <span className="trip-id">#{trip.trip_id}</span>
                    <button 
                      className="btn-report-icon"
                      onClick={() => handleViewDetails(trip)}
                      title="Reportar problema"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="12" y1="18" x2="12" y2="12"></line>
                        <line x1="9" y1="15" x2="15" y2="15"></line>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="trip-card-body">
                  <div className="trip-info-row">
                    <strong>Conductor:</strong>
                    <span>{trip.driver_name}</span>
                  </div>
                  
                  <div className="trip-info-row">
                    <strong>Vehículo:</strong>
                    <span className="vehicle-info">
                      {trip.vehicle_plate} - {trip.vehicle_brand} {trip.vehicle_model}
                    </span>
                  </div>
                  
                  <div className="trip-route">
                    <div className="route-point">
                      <span>{trip.origin}</span>
                    </div>
                    <div className="route-arrow">→</div>
                    <div className="route-point">
                      <span>{trip.destination}</span>
                    </div>
                  </div>
                  
                  <div className="trip-info-row">
                    <strong>Inicio:</strong>
                    <span>
                      {new Date(trip.started_at).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="trip-card-footer">
                  {trip.status === 'IN_PROGRESS' && (
                    <button 
                      className="btn-end-trip"
                      onClick={() => handleEndTrip(trip.trip_id)}
                    >
                      Finalizar Viaje
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para crear viaje */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Iniciar Nuevo Viaje</h2>
            <form onSubmit={handleCreateTrip}>
              <div className="form-group">
                <label>Asignación (Conductor - Vehículo):</label>
                <select
                  value={newTrip.assignment_id}
                  onChange={(e) => setNewTrip({...newTrip, assignment_id: e.target.value})}
                  required
                >
                  <option value="">Seleccione una asignación</option>
                  {assignments.map((assignment) => (
                    <option key={assignment.assignment_id} value={assignment.assignment_id}>
                      {assignment.driver_name} - {assignment.vehicle_plate} ({assignment.brand} {assignment.model})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Origen:</label>
                <input
                  type="text"
                  value={newTrip.origin}
                  onChange={(e) => setNewTrip({...newTrip, origin: e.target.value})}
                  placeholder="Ej: Ciudad de Guatemala"
                  required
                />
              </div>

              <div className="form-group">
                <label>Destino:</label>
                <input
                  type="text"
                  value={newTrip.destination}
                  onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})}
                  placeholder="Ej: Antigua Guatemala"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-submit">
                  Iniciar Viaje
                </button>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalles del viaje */}
      {showDetailModal && selectedTrip && (
        <TripDetailModal 
          trip={selectedTrip} 
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTrip(null);
          }}
        />
      )}
    </div>
  );
}

// Componente separado para el modal de detalles
function TripDetailModal({ trip, onClose }) {
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const issueTypes = [
    'MECHANICAL_FAILURE',
    'ACCIDENT',
    'TRAFFIC_VIOLATION',
    'DRIVER_FATIGUE',
    'VEHICLE_DAMAGE',
    'ROUTE_DEVIATION',
    'OTHER'
  ];

  const issueTypeLabels = {
    'MECHANICAL_FAILURE': 'Falla Mecánica',
    'ACCIDENT': 'Accidente',
    'TRAFFIC_VIOLATION': 'Violación de Tránsito',
    'DRIVER_FATIGUE': 'Fatiga del Conductor',
    'VEHICLE_DAMAGE': 'Daño al Vehículo',
    'ROUTE_DEVIATION': 'Desviación de Ruta',
    'OTHER': 'Otro'
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    
    if (!issueType || !description.trim()) {
      setError('Todos los campos son requeridos');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await issueService.create({
        trip_id: trip.trip_id,
        vehicle_id: trip.vehicle_id,
        driver_id: trip.driver_id,
        issue_type: issueType,
        description: description.trim()
      });

      setSuccess('Reporte enviado exitosamente');
      setIssueType('');
      setDescription('');
      
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2000);
    } catch (err) {
      setError('Error al enviar el reporte: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reportar Problema - Viaje #{trip.trip_id}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        
        <div className="trip-detail-content">
          {/* Información del viaje */}
          <div className="trip-detail-info">
            <h3>Información del Viaje</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Conductor:</strong>
                <span>{trip.driver_name}</span>
              </div>
              <div className="detail-item">
                <strong>Vehículo:</strong>
                <span>{trip.vehicle_plate} - {trip.vehicle_brand} {trip.vehicle_model}</span>
              </div>
              <div className="detail-item">
                <strong>Ruta:</strong>
                <span>{trip.origin} → {trip.destination}</span>
              </div>
              <div className="detail-item">
                <strong>Estado:</strong>
                <span className={`status-badge status-${trip.status.toLowerCase()}`}>
                  {trip.status === 'IN_PROGRESS' ? 'EN PROGRESO' : trip.status === 'COMPLETED' ? 'COMPLETADO' : 'CANCELADO'}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario de reporte */}
          <div className="issue-form-section">
            <h3>Reportar Problema</h3>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleSubmitIssue}>
              <div className="form-group">
                <label>Tipo de Problema:</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  required
                  disabled={submitting}
                >
                  <option value="">Seleccione un tipo</option>
                  {issueTypes.map(type => (
                    <option key={type} value={type}>
                      {issueTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Descripción del Problema:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describa detalladamente el problema..."
                  rows="5"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Enviando...' : 'Enviar Reporte'}
                </button>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trips;
