-- 03_views.sql
USE AutoAwakeAI;

-- =========================================================
-- VISTA: Viajes activos (IN_PROGRESS) con piloto y vehículo
-- =========================================================
CREATE OR REPLACE VIEW v_active_trips AS
SELECT
    t.trip_id,
    t.vehicle_id,
    v.plate              AS vehicle_plate,
    t.driver_id,
    CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
    t.origin,
    t.destination,
    t.started_at,
    t.status
FROM trips t
JOIN vehicles v  ON v.vehicle_id  = t.vehicle_id
JOIN drivers  d  ON d.driver_id   = t.driver_id
WHERE t.status = 'IN_PROGRESS';

-- =========================================================
-- VISTA: Asignaciones activas (sin fecha de fin) de cada driver
-- =========================================================
CREATE OR REPLACE VIEW v_driver_current_assignment AS
SELECT
    dva.assignment_id,
    dva.driver_id,
    CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
    dva.vehicle_id,
    v.plate                                AS vehicle_plate,
    dva.assigned_from
FROM driver_vehicle_assignments dva
JOIN drivers  d ON d.driver_id   = dva.driver_id
JOIN vehicles v ON v.vehicle_id  = dva.vehicle_id
WHERE dva.assigned_to IS NULL;

-- =========================================================
-- VISTA: Última alerta por vehículo
-- =========================================================
CREATE OR REPLACE VIEW v_vehicle_last_alert AS
SELECT
    v.vehicle_id,
    v.plate AS vehicle_plate,
    a.alert_id,
    a.alert_type,
    a.severity,
    a.message,
    a.detected_at
FROM vehicles v
LEFT JOIN (
    SELECT a1.*
    FROM alerts a1
    JOIN (
        SELECT vehicle_id, MAX(detected_at) AS max_detected_at
        FROM alerts
        GROUP BY vehicle_id
    ) latest
    ON latest.vehicle_id = a1.vehicle_id
   AND latest.max_detected_at = a1.detected_at
) a ON a.vehicle_id = v.vehicle_id;

-- =========================================================
-- VISTA: Issues abiertos o en progreso, con piloto/vehículo
-- =========================================================
CREATE OR REPLACE VIEW v_open_issues AS
SELECT
    i.issue_id,
    i.issue_type,
    i.description,
    i.status,
    i.reported_at,
    v.vehicle_id,
    v.plate AS vehicle_plate,
    d.driver_id,
    CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
    i.trip_id
FROM issues i
LEFT JOIN vehicles v ON v.vehicle_id = i.vehicle_id
LEFT JOIN drivers  d ON d.driver_id  = i.driver_id
WHERE i.status IN ('OPEN', 'IN_PROGRESS');

-- =========================================================
-- VISTA: Resumen de alertas por viaje
-- =========================================================
CREATE OR REPLACE VIEW v_trip_alerts_summary AS
SELECT
    t.trip_id,
    t.vehicle_id,
    v.plate AS vehicle_plate,
    t.driver_id,
    CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
    t.started_at,
    t.ended_at,
    t.status,
    COUNT(a.alert_id)                           AS total_alerts,
    SUM(a.severity IN ('HIGH', 'CRITICAL'))     AS critical_or_high_alerts
FROM trips t
JOIN vehicles v ON v.vehicle_id = t.vehicle_id
JOIN drivers  d ON d.driver_id  = t.driver_id
LEFT JOIN alerts a ON a.trip_id  = t.trip_id
GROUP BY
    t.trip_id,
    t.vehicle_id,
    v.plate,
    t.driver_id,
    d.first_name,
    d.last_name,
    t.started_at,
    t.ended_at,
    t.status;

-- =========================================================
-- VISTA: Estado "salud" del vehículo (último estado + issues)
-- =========================================================
CREATE OR REPLACE VIEW v_vehicle_health AS
SELECT
    v.vehicle_id,
    v.plate,
    v.brand,
    v.model,
    v.status AS vehicle_status,
    d.device_id,
    d.status AS device_status,
    d.last_seen_at,
    la.alert_id         AS last_alert_id,
    la.alert_type       AS last_alert_type,
    la.severity         AS last_alert_severity,
    la.detected_at      AS last_alert_detected_at,
    (SELECT COUNT(*)
     FROM issues i
     WHERE i.vehicle_id = v.vehicle_id
       AND i.status IN ('OPEN', 'IN_PROGRESS')) AS open_issues_count
FROM vehicles v
LEFT JOIN devices d ON d.vehicle_id = v.vehicle_id
LEFT JOIN v_vehicle_last_alert la ON la.vehicle_id = v.vehicle_id;
