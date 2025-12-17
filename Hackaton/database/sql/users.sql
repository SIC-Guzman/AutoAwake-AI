-- Script auxiliar para poblar usuarios/roles (después de ejecutar 01_schema.sql y 04_procedures.sql)
USE AutoAwakeAI;

-- Roles base (idempotente)
INSERT INTO roles (role_id, name, description) VALUES
(1, 'ADMIN',   'Administrator with full access'),
(2, 'MANAGER', 'Fleet manager with monitoring access'),
(3, 'DRIVER',  'Driver with limited access')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- Usuarios de ejemplo (hash + salt)
SET @salt_admin   = UUID();
SET @salt_driver  = UUID();

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
    'Driver Demo',
    'driver@autoawake.ai',
    UPPER(SHA2(CONCAT('driver123', @salt_driver), 256)),
    @salt_driver,
    (SELECT role_id FROM roles WHERE name = 'DRIVER' LIMIT 1),
    'ACTIVE'
)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role_id = VALUES(role_id);

-- Ejemplo de login: devuelve user_id, role_name y token de sesión
SET @out_user_id = NULL;
SET @out_role    = NULL;
SET @out_token   = NULL;
CALL sp_login_user('admin@autoawake.ai', 'admin123', @out_user_id, @out_role, @out_token);
SELECT @out_user_id AS user_id, @out_role AS role, @out_token AS session_token;
