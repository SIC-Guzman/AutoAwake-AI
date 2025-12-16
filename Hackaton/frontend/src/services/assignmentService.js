const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const assignmentService = {
  // Get all assignments (active or all)
  getAll: async (activeOnly = true) => {
    try {
      const url = activeOnly 
        ? `${API_URL}/assignments/?active_only=true`
        : `${API_URL}/assignments/`;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error fetching assignments');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  },

  // Get assignment by driver
  getByDriver: async (driverId) => {
    try {
      const response = await fetch(`${API_URL}/assignments/driver/${driverId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Error fetching driver assignment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getByDriver:', error);
      throw error;
    }
  },

  // Get assignment by vehicle
  getByVehicle: async (vehicleId) => {
    try {
      const response = await fetch(`${API_URL}/assignments/vehicle/${vehicleId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Error fetching vehicle assignment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getByVehicle:', error);
      throw error;
    }
  },

  // Create new assignment
  create: async (assignmentData) => {
    try {
      const response = await fetch(`${API_URL}/assignments/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(assignmentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error creating assignment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  },

  // Close assignment
  close: async (assignmentId) => {
    try {
      const response = await fetch(`${API_URL}/assignments/${assignmentId}/close`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error closing assignment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in close:', error);
      throw error;
    }
  }
};
