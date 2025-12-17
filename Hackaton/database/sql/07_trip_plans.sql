-- Tabla para planificar viajes que arrancan al recibir alerta TRIP
USE AutoAwakeAI;

CREATE TABLE IF NOT EXISTS trip_plans (
    plan_id     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    driver_id   BIGINT UNSIGNED NOT NULL,
    vehicle_id  BIGINT UNSIGNED NOT NULL,
    origin      VARCHAR(150)    NOT NULL,
    destination VARCHAR(150)    NOT NULL,
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at     DATETIME        NULL,
    PRIMARY KEY (plan_id),
    KEY idx_trip_plans_driver (driver_id, is_active),
    KEY idx_trip_plans_vehicle (vehicle_id, is_active),
    CONSTRAINT fk_trip_plans_driver
        FOREIGN KEY (driver_id) REFERENCES drivers(driver_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_trip_plans_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Para datos existentes, sugerencia: definir destinos frecuentes y marcar is_active=1
