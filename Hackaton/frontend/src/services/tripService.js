const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const tripService = {
  // Listar todos los viajes
  async getAll(status = null, limit = 100) {
    const token = localStorage.getItem('token');
    let url = `${API_URL}/trips/?limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al obtener viajes');
    }
    
    return response.json();
  },

  // Crear un nuevo viaje
  async create(tripData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/trips/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(tripData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al crear viaje');
    }
    
    return response.json();
  },

  // Finalizar un viaje
  async end(tripId, status = 'COMPLETED') {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/trips/${tripId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al finalizar viaje');
    }
    
    return response.json();
  },

  // Obtener un viaje por ID
  async getById(tripId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/trips/${tripId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al obtener viaje');
    }
    
    return response.json();
  },

  // Obtener viajes por conductor
  async getByDriver(driverId, limit = 50) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/trips/driver/${driverId}?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al obtener viajes del conductor');
    }
    
    return response.json();
  },

  // Obtener viajes por vehículo
  async getByVehicle(vehicleId, limit = 50) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/trips/vehicle/${vehicleId}?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al obtener viajes del vehículo');
    }
    
    return response.json();
  },

  // Obtener estadísticas de viajes activos (para dashboard)
  async getActiveTripsStats() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/trips/stats/active`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener estadísticas de viajes activos');
    }
    
    return response.json();
  }
};

export default tripService;
