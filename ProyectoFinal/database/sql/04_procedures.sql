-- 04_procedures.sql
USE AutoAwakeAI;

DELIMITER $$

-- =========================================================
-- SP: Iniciar viaje (crea trips IN_PROGRESS y devuelve trip_id)
-- =========================================================
CREATE PROCEDURE sp_start_trip (
    IN  p_vehicle_id   BIGINT UNSIGNED,
    IN  p_driver_id    BIGINT UNSIGNED,
    IN  p_origin       VARCHAR(150),
    IN  p_destination  VARCHAR(150),
    OUT p_trip_id      BIGINT UNSIGNED
)
BEGIN
    INSERT INTO trips (
        vehicle_id,
        driver_id,
        started_at,
        origin,
        destination,
        status
    ) VALUES (
        p_vehicle_id,
        p_driver_id,
        NOW(),
        p_origin,
        p_destination,
        'IN_PROGRESS'
    );

    SET p_trip_id = LAST_INSERT_ID();
END$$

-- =========================================================
-- SP: Finalizar viaje (marca ended_at = NOW() y opcionalmente status)
--   - Si p_status es NULL o vacío, el trigger se encargará
--     de poner FINISHED si corresponde.
-- =========================================================
CREATE PROCEDURE sp_end_trip (
    IN p_trip_id BIGINT UNSIGNED,
    IN p_status  VARCHAR(20)
)
BEGIN
    IF p_status IS NULL OR p_status = '' THEN
        UPDATE trips
        SET ended_at = NOW()
        WHERE trip_id = p_trip_id;
    ELSE
        UPDATE trips
        SET ended_at = NOW(),
            status   = p_status
        WHERE trip_id = p_trip_id;
    END IF;
END$$

-- =========================================================
-- SP: Registrar alerta asociada a un trip
--   - Recupera vehicle_id y driver_id desde trips
-- =========================================================
CREATE PROCEDURE sp_log_alert (
    IN p_trip_id    BIGINT UNSIGNED,
    IN p_alert_type VARCHAR(50),
    IN p_severity   VARCHAR(10),
    IN p_message    VARCHAR(255)
)
BEGIN
    DECLARE v_vehicle_id BIGINT UNSIGNED;
    DECLARE v_driver_id  BIGINT UNSIGNED;

    SELECT t.vehicle_id, t.driver_id
    INTO   v_vehicle_id, v_driver_id
    FROM trips t
    WHERE t.trip_id = p_trip_id;

    IF v_vehicle_id IS NULL OR v_driver_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid trip_id for alert';
    END IF;

    INSERT INTO alerts (
        vehicle_id,
        driver_id,
        trip_id,
        alert_type,
        severity,
        message,
        detected_at
    ) VALUES (
        v_vehicle_id,
        v_driver_id,
        p_trip_id,
        p_alert_type,
        p_severity,
        p_message,
        NOW()
    );
END$$

-- =========================================================
-- SP: Crear issue (incidencia)
-- =========================================================
CREATE PROCEDURE sp_open_issue (
    IN p_vehicle_id   BIGINT UNSIGNED,
    IN p_driver_id    BIGINT UNSIGNED,
    IN p_trip_id      BIGINT UNSIGNED,
    IN p_issue_type   VARCHAR(100),
    IN p_description  TEXT
)
BEGIN
    INSERT INTO issues (
        vehicle_id,
        driver_id,
        trip_id,
        issue_type,
        description,
        status,
        reported_at
    ) VALUES (
        p_vehicle_id,
        p_driver_id,
        p_trip_id,
        p_issue_type,
        p_description,
        'OPEN',
        NOW()
    );
END$$

-- =========================================================
-- SP: Cerrar issue
-- =========================================================
CREATE PROCEDURE sp_close_issue (
    IN p_issue_id BIGINT UNSIGNED
)
BEGIN
    UPDATE issues
    SET status      = 'CLOSED',
        resolved_at = NOW()
    WHERE issue_id  = p_issue_id;
END$$

-- =========================================================
-- SP: Actualizar estado del dispositivo (ONLINE/OFFLINE)
--   - Si se marca ONLINE, el trigger ya actualiza last_seen_at
-- =========================================================
CREATE PROCEDURE sp_update_device_status (
    IN p_device_id BIGINT UNSIGNED,
    IN p_status    VARCHAR(10),
    IN p_firmware_version VARCHAR(50)
)
BEGIN
    UPDATE devices
    SET status          = p_status,
        firmware_version = COALESCE(p_firmware_version, firmware_version)
    WHERE device_id = p_device_id;
END$$

DELIMITER ;
