import vehicleService from './vehicleService';
import driverService from './driverService';

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const dashboardService = {
  // Get general dashboard statistics using existing endpoints
  getStats: async () => {
    try {
      // Use existing endpoints to build statistics
      const [vehicles, drivers] = await Promise.all([
        vehicleService.getAll('ACTIVE'),
        driverService.getAll('ACTIVE')
      ]);

      // Try to get alerts count (if endpoint exists)
      let alertsCount = 0;
      try {
        const alertsResponse = await fetch(`${API_URL}/alerts/`, {
          method: 'GET',
          headers: getAuthHeaders()
        });
        if (alertsResponse.ok) {
          const alerts = await alertsResponse.json();
          // Filter last 24 hours
          const yesterday = new Date();
          yesterday.setHours(yesterday.getHours() - 24);
          alertsCount = alerts.filter(a => new Date(a.detected_at) > yesterday).length;
        }
      } catch (err) {
        console.log('Alerts endpoint not available or no alerts');
      }

      return {
        total_vehicles: vehicles.length,
        alerts_24h: alertsCount,
        active_trips: 0, // Will need trips endpoint
        total_drivers: drivers.length
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  },

  // Get all alerts and process for drowsy vehicles
  getTopDrowsyVehicles: async (limit = 5) => {
    try {
      const vehicles = await vehicleService.getAll('ACTIVE');
      
      // Mock data for now - would need alerts endpoint
      const vehiclesWithAlerts = vehicles.slice(0, limit).map((v, i) => ({
        vehicle_id: v.vehicle_id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        alert_count: Math.floor(Math.random() * 10) // Temporary mock data
      }));

      return vehiclesWithAlerts.sort((a, b) => b.alert_count - a.alert_count);
    } catch (error) {
      console.error('Error in getTopDrowsyVehicles:', error);
      return [];
    }
  },

  // Get alerts grouped by day
  getAlertsByDay: async (days = 7) => {
    try {
      // Mock data structure for chart - would need alerts endpoint
      const data = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 15), // Temporary mock data
          high_severity: Math.floor(Math.random() * 5),
          medium_severity: Math.floor(Math.random() * 7),
          low_severity: Math.floor(Math.random() * 3)
        });
      }
      return data;
    } catch (error) {
      console.error('Error in getAlertsByDay:', error);
      return [];
    }
  },

  // Get recent alerts
  getRecentAlerts: async (limit = 10) => {
    try {
      // Mock data - would need alerts endpoint with joins
      return [];
    } catch (error) {
      console.error('Error in getRecentAlerts:', error);
      return [];
    }
  }
};
