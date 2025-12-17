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

-- =========================================================
-- SP: Registrar usuario (hash en BD + validación de rol)
-- =========================================================
CREATE PROCEDURE sp_register_user (
    IN  p_full_name       VARCHAR(120),
    IN  p_email           VARCHAR(150),
    IN  p_password_plain  TEXT,
    IN  p_role_name       VARCHAR(50),
    OUT p_user_id         BIGINT UNSIGNED
)
BEGIN
    DECLARE v_role_id  TINYINT UNSIGNED;
    DECLARE v_salt     CHAR(36);
    DECLARE v_hash     CHAR(64);

    SELECT role_id
    INTO   v_role_id
    FROM roles
    WHERE name = p_role_name
    LIMIT 1;

    IF v_role_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ROLE_NOT_FOUND';
    END IF;

    IF EXISTS (SELECT 1 FROM users WHERE email = LOWER(p_email)) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'EMAIL_ALREADY_EXISTS';
    END IF;

    SET v_salt = UUID();
    SET v_hash = UPPER(SHA2(CONCAT(p_password_plain, v_salt), 256));

    INSERT INTO users (
        full_name, email, password_hash, password_salt, role_id
    ) VALUES (
        p_full_name,
        LOWER(p_email),
        v_hash,
        v_salt,
        v_role_id
    );

    SET p_user_id = LAST_INSERT_ID();
END$$

-- =========================================================
-- SP: Login de usuario (genera token de sesión)
-- =========================================================
DROP PROCEDURE IF EXISTS sp_login_user$$
CREATE PROCEDURE sp_login_user (
    IN  p_email           VARCHAR(150),
    IN  p_password_plain  TEXT,
    OUT p_user_id         BIGINT UNSIGNED,
    OUT p_role_name       VARCHAR(50),
    OUT p_session_token   CHAR(36)
)
BEGIN
    DECLARE v_hash     CHAR(64);
    DECLARE v_salt     CHAR(36);
    DECLARE v_role_id  TINYINT UNSIGNED;
    DECLARE v_status   ENUM('ACTIVE', 'DISABLED');

    SELECT
        u.user_id,
        u.password_hash,
        u.password_salt,
        u.role_id,
        u.status
    INTO
        p_user_id,
        v_hash,
        v_salt,
        v_role_id,
        v_status
    FROM users u
    WHERE u.email COLLATE utf8mb4_unicode_ci = LOWER(p_email) COLLATE utf8mb4_unicode_ci
    LIMIT 1;

    IF p_user_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'INVALID_CREDENTIALS';
    END IF;

    IF v_status <> 'ACTIVE' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'USER_DISABLED';
    END IF;

    IF v_hash <> UPPER(SHA2(CONCAT(p_password_plain, v_salt), 256)) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'INVALID_CREDENTIALS';
    END IF;

    UPDATE users
    SET last_login_at = NOW()
    WHERE user_id = p_user_id;

    SELECT name INTO p_role_name
    FROM roles
    WHERE role_id = v_role_id;

    SET p_session_token = UUID();
    INSERT INTO user_sessions (user_id, token)
    VALUES (p_user_id, p_session_token);
END$$

-- =========================================================
-- SP: Cerrar sesión (revocar token)
-- =========================================================
CREATE PROCEDURE sp_logout_session (
    IN p_session_token CHAR(36)
)
BEGIN
    UPDATE user_sessions
    SET revoked_at = NOW()
    WHERE token = p_session_token
      AND revoked_at IS NULL;
END$$

DELIMITER ;
