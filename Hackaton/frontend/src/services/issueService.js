const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const issueService = {
  // Crear un nuevo reporte de problema
  async create(issueData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/issues/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(issueData)
    });

    if (!response.ok) {
      throw new Error('Error al crear el reporte');
    }

    return await response.json();
  },

  // Obtener todos los reportes
  async getAll() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/issues/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener los reportes');
    }

    return await response.json();
  },

  // Cerrar un reporte
  async close(issueId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/issues/${issueId}/close`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al cerrar el reporte');
    }

    return await response.json();
  },

  // Actualizar estado del reporte
  async updateStatus(issueId, newStatus) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/issues/${issueId}/status?new_status=${newStatus}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el estado del reporte');
    }

    return await response.json();
  }
};

export default issueService;
