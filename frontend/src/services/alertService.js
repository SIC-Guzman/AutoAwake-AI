const API_URL = import.meta.env.VITE_API_URL;

/**
 * Servicio para la gestión de alertas de somnolencia
 */
const alertService = {
  /**
   * Obtiene todas las alertas con filtros opcionales
   * @param {Object} filters - Filtros de búsqueda
   * @param {number} filters.driver_id - ID del conductor (opcional)
   * @param {number} filters.vehicle_id - ID del vehículo (opcional)
   * @param {string} filters.start_date - Fecha inicio (opcional)
   * @param {string} filters.end_date - Fecha fin (opcional)
   * @param {number} filters.limit - Límite de resultados (opcional)
   * @returns {Promise<Array>} - Lista de alertas
   */
  getAll: async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.driver_id) params.append('driver_id', filters.driver_id);
      if (filters.vehicle_id) params.append('vehicle_id', filters.vehicle_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.limit) params.append('limit', filters.limit);
      
      const url = `${API_URL}/alerts/?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al obtener alertas');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getAll alerts:', error);
      throw error;
    }
  },

  /**
   * Obtiene alertas por viaje
   * @param {number} tripId - ID del viaje
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Array>} - Lista de alertas
   */
  getByTrip: async (tripId, limit = 100) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/alerts/trip/${tripId}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al obtener alertas del viaje');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getByTrip:', error);
      throw error;
    }
  },

  /**
   * Obtiene alertas por vehículo
   * @param {number} vehicleId - ID del vehículo
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Array>} - Lista de alertas
   */
  getByVehicle: async (vehicleId, limit = 100) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/alerts/vehicle/${vehicleId}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al obtener alertas del vehículo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getByVehicle:', error);
      throw error;
    }
  },

  /**
   * Obtiene alertas por conductor
   * @param {number} driverId - ID del conductor
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Array>} - Lista de alertas
   */
  getByDriver: async (driverId, limit = 100) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/alerts/driver/${driverId}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al obtener alertas del conductor');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getByDriver:', error);
      throw error;
    }
  },

  /**
   * Registra una nueva alerta
   * @param {Object} alertData - Datos de la alerta
   * @param {number} alertData.trip_id - ID del viaje
   * @param {string} alertData.alert_type - Tipo de alerta
   * @param {string} alertData.severity - Severidad (LOW, MEDIUM, HIGH, CRITICAL)
   * @param {string} alertData.message - Mensaje de la alerta
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  create: async (alertData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/alerts/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear alerta');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en create alert:', error);
      throw error;
    }
  },
};

export default alertService;
