-- Unificar collation para evitar el error 1267 (mix utf8mb4_0900_ai_ci vs utf8mb4_unicode_ci)
-- Ejecuta este script después de crear la base con 01_schema.sql

ALTER DATABASE AutoAwakeAI CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE AutoAwakeAI;

ALTER TABLE drivers                     CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE vehicles                    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE driver_vehicle_assignments  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE trips                       CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE alerts                      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE issues                      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE devices                     CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE roles                       CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE users                       CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE user_sessions               CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
