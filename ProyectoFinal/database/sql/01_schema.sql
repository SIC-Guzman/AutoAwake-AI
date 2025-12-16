-- 01_schema.sql
-- Creación de base de datos y esquema para AutoAwakeAI

-- Opcional, pero recomendado:
SET NAMES utf8mb4;
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- Crear la base de datos (si no existe) y usarla
CREATE DATABASE IF NOT EXISTS AutoAwakeAI
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE AutoAwakeAI;

-- =========================================================
-- 1. Tabla: drivers (pilotos)
-- =========================================================
CREATE TABLE IF NOT EXISTS drivers (
    driver_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    first_name     VARCHAR(100)    NOT NULL,
    last_name      VARCHAR(100)    NOT NULL,
    license_number VARCHAR(50)     NOT NULL,
    status         ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                             ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (driver_id),
    UNIQUE KEY ux_drivers_license_number (license_number),
    KEY idx_drivers_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- =========================================================
-- 2. Tabla: vehicles (vehículos)
-- =========================================================
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    plate      VARCHAR(20)     NOT NULL,
    brand      VARCHAR(100)    NOT NULL,
    model      VARCHAR(100)    NOT NULL,
    status     ENUM('ACTIVE', 'MAINTENANCE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (vehicle_id),
    UNIQUE KEY ux_vehicles_plate (plate),
    KEY idx_vehicles_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- =========================================================
-- 3. Tabla: driver_vehicle_assignments
--    Asignaciones de piloto <-> vehículo
--    (histórico, con rango de fechas)
-- =========================================================
CREATE TABLE IF NOT EXISTS driver_vehicle_assignments (
    assignment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    driver_id     BIGINT UNSIGNED NOT NULL,
    vehicle_id    BIGINT UNSIGNED NOT NULL,
    assigned_from DATETIME        NOT NULL,
    assigned_to   DATETIME        NULL,
    created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (assignment_id),
    KEY idx_dva_driver (driver_id, assigned_to),
    KEY idx_dva_vehicle (vehicle_id, assigned_to),
    CONSTRAINT fk_dva_driver
        FOREIGN KEY (driver_id)
        REFERENCES drivers (driver_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_dva_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (vehicle_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- =========================================================
-- 4. Tabla: trips (viajes)
-- =========================================================
CREATE TABLE IF NOT EXISTS trips (
    trip_id     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    vehicle_id  BIGINT UNSIGNED NOT NULL,
    driver_id   BIGINT UNSIGNED NOT NULL,
    started_at  DATETIME        NOT NULL,
    ended_at    DATETIME        NULL,
    origin      VARCHAR(150)    NOT NULL,
    destination VARCHAR(150)    NOT NULL,
    status      ENUM('IN_PROGRESS', 'FINISHED', 'CANCELLED')
                 NOT NULL DEFAULT 'IN_PROGRESS',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                          ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (trip_id),
    KEY idx_trips_vehicle (vehicle_id, started_at),
    KEY idx_trips_driver (driver_id, started_at),
    KEY idx_trips_status (status),
    CONSTRAINT fk_trips_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (vehicle_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_trips_driver
        FOREIGN KEY (driver_id)
        REFERENCES drivers (driver_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- =========================================================
-- 5. Tabla: alerts (alertas de somnolencia / distracción / etc.)
-- =========================================================
CREATE TABLE IF NOT EXISTS alerts (
    alert_id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    vehicle_id  BIGINT UNSIGNED NOT NULL,
    driver_id   BIGINT UNSIGNED NOT NULL,
    trip_id     BIGINT UNSIGNED NOT NULL,
    alert_type  VARCHAR(50)     NOT NULL,  -- p.ej. 'DROWSINESS', 'DISTRACTION'
    severity    ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
                 NOT NULL DEFAULT 'LOW',
    message     VARCHAR(255)    NULL,
    detected_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                          ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (alert_id),
    KEY idx_alerts_trip (trip_id, detected_at),
    KEY idx_alerts_vehicle (vehicle_id, detected_at),
    KEY idx_alerts_driver (driver_id, detected_at),
    CONSTRAINT fk_alerts_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (vehicle_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_alerts_driver
        FOREIGN KEY (driver_id)
        REFERENCES drivers (driver_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_alerts_trip
        FOREIGN KEY (trip_id)
        REFERENCES trips (trip_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- =========================================================
-- 6. Tabla: issues (incidencias / problemas reportados)
-- =========================================================
CREATE TABLE IF NOT EXISTS issues (
    issue_id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    vehicle_id  BIGINT UNSIGNED NULL,
    driver_id   BIGINT UNSIGNED NULL,
    trip_id     BIGINT UNSIGNED NULL,
    issue_type  VARCHAR(100)    NOT NULL, -- 'MECHANICAL', 'SAFETY', 'OTHER', etc.
    description TEXT            NULL,
    status      ENUM('OPEN', 'IN_PROGRESS', 'CLOSED')
                 NOT NULL DEFAULT 'OPEN',
    reported_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME        NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                          ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (issue_id),
    KEY idx_issues_vehicle (vehicle_id, status),
    KEY idx_issues_driver (driver_id, status),
    KEY idx_issues_trip (trip_id, status),
    CONSTRAINT fk_issues_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (vehicle_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_issues_driver
        FOREIGN KEY (driver_id)
        REFERENCES drivers (driver_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_issues_trip
        FOREIGN KEY (trip_id)
        REFERENCES trips (trip_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- =========================================================
-- 7. Tabla: devices (dispositivos Raspberry / IoT en los vehículos)
-- =========================================================
CREATE TABLE IF NOT EXISTS devices (
    device_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    vehicle_id      BIGINT UNSIGNED NOT NULL,
    serial_number   VARCHAR(100)    NOT NULL,
    firmware_version VARCHAR(50)    NULL,
    last_seen_at    DATETIME        NULL,
    status          ENUM('ONLINE', 'OFFLINE', 'UNKNOWN')
                     NOT NULL DEFAULT 'OFFLINE',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                              ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id),
    UNIQUE KEY ux_devices_serial (serial_number),
    UNIQUE KEY ux_devices_vehicle (vehicle_id),
    CONSTRAINT fk_devices_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (vehicle_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Fin de 01_schema.sql
