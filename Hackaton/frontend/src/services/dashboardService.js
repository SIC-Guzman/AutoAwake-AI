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
      // Pull alerts from backend and group by day/severity (no randomness)
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      since.setDate(since.getDate() - (days - 1));

      const params = new URLSearchParams({
        start_date: since.toISOString(),
        limit: '1000', // cap to avoid huge payloads
      });

      const res = await fetch(`${API_URL}/alerts/?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        return [];
      }

      const alerts = await res.json();
      const map = new Map();

      alerts.forEach((alert) => {
        const key = new Date(alert.detected_at).toISOString().split('T')[0];
        if (!map.has(key)) {
          map.set(key, { date: key, count: 0, high_severity: 0, medium_severity: 0, low_severity: 0 });
        }
        const entry = map.get(key);
        entry.count += 1;
        if (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') entry.high_severity += 1;
        else if (alert.severity === 'MEDIUM') entry.medium_severity += 1;
        else entry.low_severity += 1;
      });

      // Build ordered array for each day even if empty
      const data = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        data.push(map.get(key) || { date: key, count: 0, high_severity: 0, medium_severity: 0, low_severity: 0 });
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
