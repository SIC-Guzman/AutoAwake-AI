const API_URL = import.meta.env.VITE_API_URL;

/**
 * Servicio para la gestión de vehículos
 */
const vehicleService = {
  /**
   * Obtiene todos los vehículos
   * @param {string} status - Filtro por estado (opcional)
   * @returns {Promise<Array>} - Lista de vehículos
   */
  getAll: async (status = null) => {
    try {
      const token = localStorage.getItem('token');
      const url = status 
        ? `${API_URL}/vehicles?status=${status}`
        : `${API_URL}/vehicles`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al obtener vehículos');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getAll vehicles:', error);
      throw error;
    }
  },

  /**
   * Obtiene un vehículo por ID
   * @param {number} vehicleId - ID del vehículo
   * @returns {Promise<Object>} - Datos del vehículo
   */
  getById: async (vehicleId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al obtener el vehículo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getById vehicle:', error);
      throw error;
    }
  },

  /**
   * Crea un nuevo vehículo
   * @param {Object} vehicleData - Datos del vehículo
   * @param {string} vehicleData.plate - Placa del vehículo
   * @param {string} vehicleData.brand - Marca
   * @param {string} vehicleData.model - Modelo
   * @param {string} vehicleData.status - Estado (ACTIVE, MAINTENANCE, INACTIVE)
   * @returns {Promise<Object>} - Vehículo creado
   */
  create: async (vehicleData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/vehicles/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear el vehículo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en create vehicle:', error);
      throw error;
    }
  },

  /**
   * Actualiza el estado de un vehículo
   * @param {number} vehicleId - ID del vehículo
   * @param {string} status - Nuevo estado
   * @returns {Promise<Object>} - Respuesta de la actualización
   */
  updateStatus: async (vehicleId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al actualizar el estado');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en updateStatus vehicle:', error);
      throw error;
    }
  },
};

export default vehicleService;
