import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MdReportProblem, MdWarning, MdCheckCircle, MdNotificationsActive } from 'react-icons/md';
import issueService from '../services/issueService';
import alertService from '../services/alertService';
import tripService from '../services/tripService';
import './Reports.css';

function Reports() {
  const [issues, setIssues] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('7'); // días
  const [closingIssue, setClosingIssue] = useState(null);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [issuesData, alertsData, tripsData] = await Promise.all([
        issueService.getAll(),
        alertService.getAll(),
        tripService.getAll()
      ]);

      console.log('Issues data received:', issuesData);
      setIssues(issuesData);
      setAlerts(alertsData);
      setTrips(tripsData);
    } catch (err) {
      setError('Error al cargar los datos: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseIssue = async (issueId) => {
    if (!window.confirm('¿Está seguro de cerrar este reporte?')) {
      return;
    }

    try {
      setClosingIssue(issueId);
      await issueService.close(issueId);
      await loadData(); // Recargar datos después de cerrar
    } catch (err) {
      setError('Error al cerrar el reporte: ' + err.message);
      console.error(err);
    } finally {
      setClosingIssue(null);
    }
  };

  // Procesar datos para gráficos
  const getIssuesByType = () => {
    const typeCount = {};
    issues.forEach(issue => {
      typeCount[issue.issue_type] = (typeCount[issue.issue_type] || 0) + 1;
    });

    const labels = {
      'MECHANICAL_FAILURE': 'Falla Mecánica',
      'ACCIDENT': 'Accidente',
      'TRAFFIC_VIOLATION': 'Violación de Tránsito',
      'DRIVER_FATIGUE': 'Fatiga del Conductor',
      'VEHICLE_DAMAGE': 'Daño al Vehículo',
      'ROUTE_DEVIATION': 'Desviación de Ruta',
      'OTHER': 'Otro'
    };

    return Object.entries(typeCount).map(([type, count]) => ({
      name: labels[type] || type,
      value: count,
      type: type
    }));
  };

  const getIssuesByStatus = () => {
    const statusCount = {
      'OPEN': 0,
      'IN_PROGRESS': 0,
      'CLOSED': 0
    };

    issues.forEach(issue => {
      statusCount[issue.status] = (statusCount[issue.status] || 0) + 1;
    });

    return [
      { name: 'Abiertos', value: statusCount['OPEN'], status: 'OPEN' },
      { name: 'En Progreso', value: statusCount['IN_PROGRESS'], status: 'IN_PROGRESS' },
      { name: 'Cerrados', value: statusCount['CLOSED'], status: 'CLOSED' }
    ];
  };

  const getIssuesByDay = () => {
    const dayCount = {};
    const today = new Date();
    const days = parseInt(dateRange);

    // Inicializar días
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dayCount[dateStr] = 0;
    }

    // Contar issues por día
    issues.forEach(issue => {
      const issueDate = new Date(issue.reported_at).toISOString().split('T')[0];
      if (dayCount.hasOwnProperty(issueDate)) {
        dayCount[issueDate]++;
      }
    });

    return Object.entries(dayCount).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      reportes: count
    }));
  };

  const getAlertsBySeverity = () => {
    const severityCount = {
      'LOW': 0,
      'MEDIUM': 0,
      'HIGH': 0,
      'CRITICAL': 0
    };

    alerts.forEach(alert => {
      severityCount[alert.severity] = (severityCount[alert.severity] || 0) + 1;
    });

    return [
      { name: 'Baja', value: severityCount['LOW'] },
      { name: 'Media', value: severityCount['MEDIUM'] },
      { name: 'Alta', value: severityCount['HIGH'] },
      { name: 'Crítica', value: severityCount['CRITICAL'] }
    ];
  };

  const COLORS = {
    pie1: ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#991b1b'],
    pie2: ['#22c55e', '#dc2626'],
    severity: ['#10b981', '#f59e0b', '#f97316', '#dc2626']
  };

  const stats = {
    totalIssues: issues.length,
    openIssues: issues.filter(i => i.status === 'OPEN').length,
    resolvedIssues: issues.filter(i => i.status === 'CLOSED').length,
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
    totalTrips: trips.length,
    activeTrips: trips.filter(t => t.status === 'IN_PROGRESS').length
  };

  if (loading) {
    return (
      <div className="reports-container">
        <div className="loading">Cargando reportes...</div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Reportes y Análisis</h1>
        <div className="date-range-selector">
          <label>Período:</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="7">Últimos 7 días</option>
            <option value="15">Últimos 15 días</option>
            <option value="30">Últimos 30 días</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon issues">
            <MdReportProblem />
          </div>
          <div className="stat-info">
            <h3>{stats.totalIssues}</h3>
            <p>Total Reportes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon open">
            <MdWarning />
          </div>
          <div className="stat-info">
            <h3>{stats.openIssues}</h3>
            <p>Reportes Abiertos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon in-progress">
            <MdReportProblem />
          </div>
          <div className="stat-info">
            <h3>{issues.filter(i => i.status === 'IN_PROGRESS').length}</h3>
            <p>En Progreso</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon resolved">
            <MdCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{stats.resolvedIssues}</h3>
            <p>Reportes Resueltos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon alerts">
            <MdNotificationsActive />
          </div>
          <div className="stat-info">
            <h3>{stats.criticalAlerts}</h3>
            <p>Alertas Críticas</p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        {/* Gráfico de barras - Reportes por día */}
        <div className="chart-card chart-dark">
          <h3>Reportes por Día</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getIssuesByDay()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="date" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #dc2626', color: '#fff' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="reportes" fill="#dc2626" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de pastel - Reportes por tipo */}
        <div className="chart-card chart-dark">
          <h3>Reportes por Tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getIssuesByType()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getIssuesByType().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.pie1[index % COLORS.pie1.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #dc2626', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de pastel - Estado de reportes */}
        <div className="chart-card chart-dark">
          <h3>Estado de Reportes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getIssuesByStatus()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getIssuesByStatus().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.pie2[index]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #dc2626', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de barras - Alertas por severidad */}
        <div className="chart-card chart-dark">
          <h3>Alertas por Severidad</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getAlertsBySeverity()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #dc2626', color: '#fff' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {getAlertsBySeverity().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.severity[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de reportes recientes */}
      <div className="recent-issues-section">
        <h3>Reportes Recientes</h3>
        <div className="issues-table-container">
          <table className="issues-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Conductor</th>
                <th>Vehículo</th>
                <th>Viaje</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {issues.slice(0, 10).map(issue => (
                <tr key={issue.issue_id}>
                  <td>#{issue.issue_id}</td>
                  <td>
                    <span className="issue-type-badge">
                      {issue.issue_type}
                    </span>
                  </td>
                  <td className="description-cell" title={issue.description}>
                    {issue.description}
                  </td>
                  <td>{issue.driver_name || 'N/A'}</td>
                  <td>
                    {issue.vehicle_plate 
                      ? `${issue.vehicle_plate} - ${issue.vehicle_brand || ''} ${issue.vehicle_model || ''}`.trim()
                      : 'N/A'
                    }
                  </td>
                  <td>#{issue.trip_id || 'N/A'}</td>
                  <td>
                    <span className={`status-badge status-${issue.status.toLowerCase().replace('_', '-')}`}>
                      {issue.status === 'OPEN' && 'ABIERTO'}
                      {issue.status === 'IN_PROGRESS' && 'EN PROGRESO'}
                      {issue.status === 'CLOSED' && 'CERRADO'}
                    </span>
                  </td>
                  <td>
                    {new Date(issue.reported_at).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td>
                    {issue.status === 'OPEN' && (
                      <button
                        className="btn-action btn-in-progress"
                        onClick={() => handleUpdateStatus(issue.issue_id, 'IN_PROGRESS')}
                        disabled={closingIssue === issue.issue_id}
                      >
                        {closingIssue === issue.issue_id ? 'Actualizando...' : 'En Progreso'}
                      </button>
                    )}
                    {issue.status === 'IN_PROGRESS' && (
                      <button
                        className="btn-action btn-close-issue"
                        onClick={() => handleUpdateStatus(issue.issue_id, 'CLOSED')}
                        disabled={closingIssue === issue.issue_id}
                      >
                        {closingIssue === issue.issue_id ? 'Cerrando...' : 'Cerrar'}
                      </button>
                    )}
                    {issue.status === 'CLOSED' && (
                      <span className="resolved-label">✓ Cerrado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {issues.length === 0 && (
            <div className="empty-state">
              <p>No hay reportes registrados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
