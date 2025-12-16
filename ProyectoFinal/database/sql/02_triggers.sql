-- 02_triggers.sql
-- Triggers para AutoAwakeAI

USE AutoAwakeAI;

DELIMITER $$

-- =========================================================
-- Trigger 1:
-- Evitar que un driver tenga MÁS de una asignación activa
-- (assigned_to IS NULL) al mismo tiempo
-- =========================================================
CREATE TRIGGER trg_dva_prevent_multiple_active_by_driver
BEFORE INSERT ON driver_vehicle_assignments
FOR EACH ROW
BEGIN
    IF NEW.assigned_to IS NULL THEN
        IF EXISTS (
            SELECT 1
            FROM driver_vehicle_assignments AS dva
            WHERE dva.driver_id = NEW.driver_id
              AND dva.assigned_to IS NULL
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Driver already has an active assignment';
        END IF;
    END IF;
END$$

-- =========================================================
-- Trigger 2:
-- Evitar que un vehicle tenga MÁS de una asignación activa
-- =========================================================
CREATE TRIGGER trg_dva_prevent_multiple_active_by_vehicle
BEFORE INSERT ON driver_vehicle_assignments
FOR EACH ROW
BEGIN
    IF NEW.assigned_to IS NULL THEN
        IF EXISTS (
            SELECT 1
            FROM driver_vehicle_assignments AS dva
            WHERE dva.vehicle_id = NEW.vehicle_id
              AND dva.assigned_to IS NULL
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Vehicle already has an active assignment';
        END IF;
    END IF;
END$$

-- =========================================================
-- Trigger 3:
-- Validar coherencia temporal en trips:
--  - ended_at no puede ser menor que started_at
-- =========================================================
CREATE TRIGGER trg_trips_validate_times_before_insert
BEFORE INSERT ON trips
FOR EACH ROW
BEGIN
    IF NEW.ended_at IS NOT NULL AND NEW.ended_at < NEW.started_at THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Trip ended_at cannot be earlier than started_at';
    END IF;
END$$

CREATE TRIGGER trg_trips_validate_times_before_update
BEFORE UPDATE ON trips
FOR EACH ROW
BEGIN
    IF NEW.ended_at IS NOT NULL AND NEW.ended_at < NEW.started_at THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Trip ended_at cannot be earlier than started_at';
    END IF;
END$$

-- =========================================================
-- Trigger 4:
-- Ajustar el status del viaje automáticamente:
--   - Si se establece ended_at y status seguía IN_PROGRESS -> FINISHED
-- =========================================================
CREATE TRIGGER trg_trips_auto_status_on_update
BEFORE UPDATE ON trips
FOR EACH ROW
BEGIN
    IF NEW.ended_at IS NOT NULL
       AND (OLD.ended_at IS NULL OR NEW.ended_at <> OLD.ended_at)
       AND OLD.status = 'IN_PROGRESS' THEN
        SET NEW.status = 'FINISHED';
    END IF;
END$$

-- =========================================================
-- Trigger 5:
-- Completar detected_at en alerts si viene NULL
-- (por ejemplo si tus dispositivos sólo envían timestamp relativo)
-- =========================================================
CREATE TRIGGER trg_alerts_default_detected_at
BEFORE INSERT ON alerts
FOR EACH ROW
BEGIN
    IF NEW.detected_at IS NULL THEN
        SET NEW.detected_at = NOW();
    END IF;
END$$

-- =========================================================
-- Trigger 6:
-- Actualizar last_seen_at cuando un device se marca ONLINE
-- (útil cuando quieras sólo cambiar el status y que se
--   actualice automáticamente el timestamp)
-- =========================================================
CREATE TRIGGER trg_devices_update_last_seen_on_online
BEFORE UPDATE ON devices
FOR EACH ROW
BEGIN
    IF NEW.status = 'ONLINE' THEN
        SET NEW.last_seen_at = NOW();
    END IF;
END$$

DELIMITER ;

-- Fin de 02_triggers.sql
