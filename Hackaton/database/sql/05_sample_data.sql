-- 05_sample_data.sql
USE AutoAwakeAI;

-- Limpiar tablas (opcional si ya probaste cosas antes)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE user_sessions;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;
TRUNCATE TABLE alerts;
TRUNCATE TABLE issues;
TRUNCATE TABLE trips;
TRUNCATE TABLE driver_vehicle_assignments;
TRUNCATE TABLE devices;
TRUNCATE TABLE vehicles;
TRUNCATE TABLE drivers;
SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- ROLES
-- =========================================================
INSERT INTO roles (role_id, name, description) VALUES
(1, 'ADMIN',   'Administrator with full access'),
(2, 'MANAGER', 'Fleet manager with monitoring access'),
(3, 'DRIVER',  'Driver with limited access')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- =========================================================
-- USERS (ejemplo con password hasheada)
-- =========================================================
SET @salt_admin = UUID();
SET @salt_manager = UUID();

INSERT INTO users (
    full_name, email, password_hash, password_salt, role_id, status
) VALUES
(
    'Admin AutoAwake',
    'admin@autoawake.ai',
    UPPER(SHA2(CONCAT('admin123', @salt_admin), 256)),
    @salt_admin,
    (SELECT role_id FROM roles WHERE name = 'ADMIN' LIMIT 1),
    'ACTIVE'
),
(
    'Manager Demo',
    'manager@autoawake.ai',
    UPPER(SHA2(CONCAT('manager123', @salt_manager), 256)),
    @salt_manager,
    (SELECT role_id FROM roles WHERE name = 'MANAGER' LIMIT 1),
    'ACTIVE'
)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role_id = VALUES(role_id);

-- =========================================================
-- DRIVERS
-- =========================================================
INSERT INTO drivers (first_name, last_name, license_number, status)
VALUES
('Carlos', 'Ramírez', 'LIC-1001', 'ACTIVE'),
('Ana',    'López',   'LIC-1002', 'ACTIVE'),
('Diego',  'Martínez','LIC-1003', 'INACTIVE');

-- =========================================================
-- VEHICLES
-- =========================================================
INSERT INTO vehicles (plate, brand, model, status)
VALUES
('P123ABC', 'Toyota', 'Hilux',      'ACTIVE'),
('P456DEF', 'Isuzu',  'NQR 75',     'ACTIVE'),
('P789GHI', 'Hyundai','H1',         'MAINTENANCE');

-- =========================================================
-- ASSIGNMENTS (uno activo para cada driver/vehicle)
-- =========================================================
INSERT INTO driver_vehicle_assignments (
    driver_id, vehicle_id, assigned_from, assigned_to
) VALUES
(1, 1, NOW() - INTERVAL 10 DAY, NULL),
(2, 2, NOW() - INTERVAL  5 DAY, NULL);

-- =========================================================
-- DEVICES (uno por vehículo)
-- =========================================================
INSERT INTO devices (
    vehicle_id, serial_number, firmware_version, last_seen_at, status
) VALUES
(1, 'RPI-0001', '1.0.0', NOW() - INTERVAL 1 HOUR, 'ONLINE'),
(2, 'RPI-0002', '1.0.1', NOW() - INTERVAL 2 HOUR, 'OFFLINE'),
(3, 'RPI-0003', '1.0.0', NULL,                     'UNKNOWN');

-- =========================================================
-- TRIPS (algunos activos y otros finalizados)
-- =========================================================
INSERT INTO trips (
    vehicle_id, driver_id, started_at, ended_at,
    origin, destination, status
) VALUES
(1, 1, NOW() - INTERVAL 3 HOUR, NULL,
 'Planta Central', 'Bodega Occidente', 'IN_PROGRESS'),
(2, 2, NOW() - INTERVAL 10 HOUR, NOW() - INTERVAL 5 HOUR,
 'Planta Central', 'Puerto', 'FINISHED');

-- =========================================================
-- ALERTS (para los viajes)
-- =========================================================
INSERT INTO alerts (
    vehicle_id, driver_id, trip_id,
    alert_type, severity, message, detected_at
) VALUES
(1, 1, 1, 'DROWSINESS', 'HIGH',    'Micro-sueño detectado', NOW() - INTERVAL 2 HOUR),
(1, 1, 1, 'DISTRACTION','LOW',     'Mirada fuera de la vía', NOW() - INTERVAL 90 MINUTE),
(2, 2, 2, 'DROWSINESS', 'CRITICAL','Ojos cerrados prolongados', NOW() - INTERVAL 6 HOUR);

-- =========================================================
-- ISSUES
-- =========================================================
INSERT INTO issues (
    vehicle_id, driver_id, trip_id,
    issue_type, description, status, reported_at
) VALUES
(1, 1, 1, 'SAFETY',     'Cinturón no utilizado durante parte del trayecto', 'OPEN',          NOW() - INTERVAL 1 HOUR),
(2, 2, 2, 'MECHANICAL', 'Ruido en frenos delanteros',                        'IN_PROGRESS',   NOW() - INTERVAL 4 HOUR),
(3, NULL, NULL, 'OTHER','Revisión general pendiente',                        'OPEN',          NOW() - INTERVAL 1 DAY);
