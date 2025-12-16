const API_URL = import.meta.env.VITE_API_URL;

/**
 * Servicio para la gestión de conductores/empleados
 */
const driverService = {
  /**
   * Obtiene todos los conductores
   * @param {string} status - Filtro por estado (opcional)
   * @returns {Promise<Array>} - Lista de conductores
   */
  getAll: async (status = null) => {
    try {
      const token = localStorage.getItem('token');
      const url = status 
        ? `${API_URL}/drivers?status=${status}`
        : `${API_URL}/drivers`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al obtener conductores');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getAll drivers:', error);
      throw error;
    }
  },

  /**
   * Obtiene un conductor por ID
   * @param {number} driverId - ID del conductor
   * @returns {Promise<Object>} - Datos del conductor
   */
  getById: async (driverId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/drivers/${driverId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al obtener el conductor');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getById driver:', error);
      throw error;
    }
  },

  /**
   * Crea un nuevo conductor
   * @param {Object} driverData - Datos del conductor
   * @param {string} driverData.first_name - Nombre del conductor
   * @param {string} driverData.last_name - Apellido del conductor
   * @param {string} driverData.license_number - Número de licencia
   * @param {string} driverData.status - Estado (ACTIVE, INACTIVE)
   * @returns {Promise<Object>} - Conductor creado
   */
  create: async (driverData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/drivers/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driverData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear el conductor');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en create driver:', error);
      throw error;
    }
  },

  /**
   * Actualiza un conductor
   * @param {number} driverId - ID del conductor
   * @param {Object} driverData - Datos a actualizar
   * @param {string} driverData.first_name - Nombre del conductor (opcional)
   * @param {string} driverData.last_name - Apellido del conductor (opcional)
   * @param {string} driverData.license_number - Número de licencia (opcional)
   * @param {string} driverData.status - Estado (opcional)
   * @returns {Promise<Object>} - Conductor actualizado
   */
  update: async (driverId, driverData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/drivers/${driverId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driverData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al actualizar el conductor');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en update driver:', error);
      throw error;
    }
  },

  /**
   * Desactiva un conductor
   * @param {number} driverId - ID del conductor
   * @returns {Promise<Object>} - Respuesta de la desactivación
   */
  deactivate: async (driverId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/drivers/${driverId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al desactivar el conductor');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en deactivate driver:', error);
      throw error;
    }
  },
};

export default driverService;
