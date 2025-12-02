# Documentación de la base de datos `AutoAwakeAI`

Esta documentación describe el diseño de la base de datos `AutoAwakeAI`, sus tablas, relaciones, vistas, triggers y procedimientos almacenados.

---

## 1. Modelo relacional (vista general)

### 1.1 Diagrama de relaciones (ER) en Mermaid

```mermaid
erDiagram
    DRIVERS {
        BIGINT driver_id PK
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR license_number
        ENUM status
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    VEHICLES {
        BIGINT vehicle_id PK
        VARCHAR plate
        VARCHAR brand
        VARCHAR model
        ENUM status
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    DRIVER_VEHICLE_ASSIGNMENTS {
        BIGINT assignment_id PK
        BIGINT driver_id FK
        BIGINT vehicle_id FK
        DATETIME assigned_from
        DATETIME assigned_to
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    TRIPS {
        BIGINT trip_id PK
        BIGINT vehicle_id FK
        BIGINT driver_id FK
        DATETIME started_at
        DATETIME ended_at
        VARCHAR origin
        VARCHAR destination
        ENUM status
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    ALERTS {
        BIGINT alert_id PK
        BIGINT vehicle_id FK
        BIGINT driver_id FK
        BIGINT trip_id FK
        VARCHAR alert_type
        ENUM severity
        VARCHAR message
        DATETIME detected_at
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    ISSUES {
        BIGINT issue_id PK
        BIGINT vehicle_id FK NULL
        BIGINT driver_id FK NULL
        BIGINT trip_id FK NULL
        VARCHAR issue_type
        TEXT description
        ENUM status
        DATETIME reported_at
        DATETIME resolved_at
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    DEVICES {
        BIGINT device_id PK
        BIGINT vehicle_id FK
        VARCHAR serial_number
        VARCHAR firmware_version
        DATETIME last_seen_at
        ENUM status
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    DRIVERS ||--o{ DRIVER_VEHICLE_ASSIGNMENTS : "tiene asignaciones"
    VEHICLES ||--o{ DRIVER_VEHICLE_ASSIGNMENTS : "asignado a"

    DRIVERS ||--o{ TRIPS : "conduce"
    VEHICLES ||--o{ TRIPS : "es usado en"

    TRIPS ||--o{ ALERTS : "genera"
    DRIVERS ||--o{ ALERTS : "recibe"
    VEHICLES ||--o{ ALERTS : "asociado a"

    VEHICLES ||--o{ ISSUES : "puede tener"
    DRIVERS ||--o{ ISSUES : "puede involucrar"
    TRIPS ||--o{ ISSUES : "puede estar asociado"

    VEHICLES ||--o{ DEVICES : "monta dispositivo"
```

---

## 2. Tabla de entidades y relaciones (resumen)

| Tabla                            | Descripción                                                       |
|----------------------------------|-------------------------------------------------------------------|
| `drivers`                        | Conductores / pilotos registrados en el sistema.                 |
| `vehicles`                       | Vehículos de la flota.                                           |
| `driver_vehicle_assignments`    | Historial de asignaciones driver–vehículo con rango de fechas.   |
| `trips`                          | Viajes (sesiones de conducción) realizados.                      |
| `alerts`                         | Alertas emitidas por AutoAwake AI (somnolencia, distracción…).   |
| `issues`                         | Incidencias/Problemas reportados (seguridad, mecánica, etc.).    |
| `devices`                        | Dispositivos físicos (Raspberry/IoT) instalados en vehículos.    |

### 2.1 Relaciones principales

| Relación                                      | Cardinalidad           | Descripción                                                          |
|-----------------------------------------------|------------------------|----------------------------------------------------------------------|
| `drivers` → `driver_vehicle_assignments`      | 1 a N                  | Un driver puede tener muchas asignaciones históricas.               |
| `vehicles` → `driver_vehicle_assignments`     | 1 a N                  | Un vehículo puede tener muchas asignaciones históricas.             |
| `drivers` → `trips`                           | 1 a N                  | Un driver realiza muchos viajes.                                    |
| `vehicles` → `trips`                          | 1 a N                  | Un vehículo participa en muchos viajes.                             |
| `trips` → `alerts`                            | 1 a N                  | Un viaje puede generar múltiples alertas.                           |
| `drivers` → `alerts`                          | 1 a N                  | Un driver puede tener múltiples alertas asociadas.                  |
| `vehicles` → `alerts`                         | 1 a N                  | Un vehículo puede tener múltiples alertas asociadas.                |
| `vehicles` → `issues`                         | 1 a N (opcional)       | Un vehículo puede tener múltiples incidencias.                      |
| `drivers` → `issues`                          | 1 a N (opcional)       | Un driver puede estar asociado a múltiples incidencias.             |
| `trips` → `issues`                            | 1 a N (opcional)       | Un viaje puede tener múltiples incidencias.                         |
| `vehicles` → `devices`                        | 1 a 1 (lógica de diseño)| Cada vehículo tiene un dispositivo principal (único) instalado.     |

---

## 3. Descripción de tablas (nivel lógico)

### 3.1 `drivers`

- **Función:** almacena la información de los conductores.
- Campos clave:
  - `driver_id` (PK)
  - `license_number` (único)
  - `status` (`ACTIVE`, `INACTIVE`)

**Uso típico:**
- Gestión de conductores activos.
- Referencia en viajes, alertas, issues y asignaciones.

---

### 3.2 `vehicles`

- **Función:** representa los vehículos de la flota.
- Campos clave:
  - `vehicle_id` (PK)
  - `plate` (único)
  - `status` (`ACTIVE`, `MAINTENANCE`, `INACTIVE`)

**Uso típico:**
- Estado de la flota.
- Relación con trips, alerts, issues y devices.

---

### 3.3 `driver_vehicle_assignments`

- **Función:** historial de qué piloto maneja qué vehículo y en qué rango de fechas.
- Campos clave:
  - `assignment_id` (PK)
  - `driver_id` (FK → `drivers`)
  - `vehicle_id` (FK → `vehicles`)
  - `assigned_from`, `assigned_to` (NULL = asignación activa)

**Uso típico:**
- Saber quién es el conductor responsable de un vehículo en un intervalo.
- Evitar asignaciones simultáneas inconsistentes (por triggers).

---

### 3.4 `trips`

- **Función:** modela un viaje o sesión de conducción.
- Campos clave:
  - `trip_id` (PK)
  - `vehicle_id` (FK → `vehicles`)
  - `driver_id` (FK → `drivers`)
  - `started_at`, `ended_at`
  - `status` (`IN_PROGRESS`, `FINISHED`, `CANCELLED`)

**Uso típico:**
- Registrar el inicio/fin de un viaje.
- Asociar alertas e incidencias a una sesión específica.

---

### 3.5 `alerts`

- **Función:** alertas generadas por el sistema de visión/IA.
- Campos clave:
  - `alert_id` (PK)
  - `vehicle_id` (FK)
  - `driver_id` (FK)
  - `trip_id` (FK)
  - `alert_type` (ej. `DROWSINESS`, `DISTRACTION`)
  - `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)

**Uso típico:**
- Auditoría de eventos de seguridad.
- Dashboards por vehículo, viaje o driver.

---

### 3.6 `issues`

- **Función:** incidencias registradas por supervisores o el sistema (problemas mecánicos, de seguridad, etc.).
- Campos clave:
  - `issue_id` (PK)
  - `vehicle_id`, `driver_id`, `trip_id` (FK opcionales)
  - `issue_type` (ej. `MECHANICAL`, `SAFETY`, `OTHER`)
  - `status` (`OPEN`, `IN_PROGRESS`, `CLOSED`)

**Uso típico:**
- Gestión de tickets / problemas.
- Vincular eventos a viajes o vehículos específicos.

---

### 3.7 `devices`

- **Función:** representa el dispositivo IoT en cada vehículo.
- Campos clave:
  - `device_id` (PK)
  - `vehicle_id` (FK → `vehicles`)
  - `serial_number` (único)
  - `status` (`ONLINE`, `OFFLINE`, `UNKNOWN`)
  - `last_seen_at`

**Uso típico:**
- Monitoreo de conectividad de los dispositivos.
- Relación con métricas de salud del sistema.

---

## 4. Triggers (disparadores)

Los triggers se usan para reforzar reglas de negocio y mantener coherencia automática.

### 4.1 `trg_dva_prevent_multiple_active_by_driver`

**Tabla:** `driver_vehicle_assignments`  
**Momento:** `BEFORE INSERT`

**Objetivo:**
- Evitar que un mismo `driver_id` tenga más de una asignación activa (fila con `assigned_to IS NULL`).

**Lógica:**
- Si el nuevo registro (`NEW`) viene con `assigned_to IS NULL`, se hace una consulta a la misma tabla buscando otra asignación activa para ese mismo `driver_id`.
- Si existe, se lanza un `SIGNAL` con error:
  - `'Driver already has an active assignment'`.

**Beneficio:**
- La base de datos garantiza la unicidad de asignación activa para conductores, sin depender solo del backend.

---

### 4.2 `trg_dva_prevent_multiple_active_by_vehicle`

**Tabla:** `driver_vehicle_assignments`  
**Momento:** `BEFORE INSERT`

**Objetivo:**
- Evitar que un mismo `vehicle_id` tenga más de una asignación activa simultánea.

**Lógica:**
- Misma idea que el trigger anterior, pero aplicada a `vehicle_id`.

**Beneficio:**
- Garantiza que un vehículo solo tenga un conductor activo a la vez.

---

### 4.3 `trg_trips_validate_times_before_insert` y `trg_trips_validate_times_before_update`

**Tabla:** `trips`  
**Momentos:** `BEFORE INSERT` y `BEFORE UPDATE`

**Objetivo:**
- Validar coherencia de tiempos:
  - `ended_at` no puede ser menor que `started_at`.

**Lógica:**
- Si `ended_at` no es NULL y es menor a `started_at`, se lanza `SIGNAL` con mensaje:
  - `'Trip ended_at cannot be earlier than started_at'`.

**Beneficio:**
- Evita datos absurdos (viajes que terminan antes de empezar) por errores del cliente o desajustes.

---

### 4.4 `trg_trips_auto_status_on_update`

**Tabla:** `trips`  
**Momento:** `BEFORE UPDATE`

**Objetivo:**
- Ajustar automáticamente el `status` del viaje cuando se establece `ended_at`:
  - Si `ended_at` pasa de NULL a un valor y el `status` todavía es `IN_PROGRESS`, se actualiza a `FINISHED`.

**Lógica:**
- Compara `OLD.ended_at` con `NEW.ended_at`.
- Solo actúa cuando hay cambio de valor y el estado anterior era `IN_PROGRESS`.

**Beneficio:**
- Reduce la lógica que el backend debe manejar.
- Asegura consistencia entre tiempos y estado del viaje.

---

### 4.5 `trg_alerts_default_detected_at`

**Tabla:** `alerts`  
**Momento:** `BEFORE INSERT`

**Objetivo:**
- Completar `detected_at` automáticamente si viene NULL.

**Lógica:**
- Si `NEW.detected_at` es NULL, se asigna `NOW()`.

**Beneficio:**
- Permite a dispositivos o servicios enviar alertas sin preocuparse por el timestamp exacto.

---

### 4.6 `trg_devices_update_last_seen_on_online`

**Tabla:** `devices`  
**Momento:** `BEFORE UPDATE`

**Objetivo:**
- Actualizar `last_seen_at` cada vez que un dispositivo se marca `ONLINE`.

**Lógica:**
- Si `NEW.status = 'ONLINE'`, se setea `NEW.last_seen_at = NOW()`.

**Beneficio:**
- Mantiene al día la última vez que el dispositivo estuvo activo sin depender de lógica externa.

---

## 5. Vistas (`VIEWs`)

Las vistas encapsulan consultas comunes para simplificar el acceso desde el backend o herramientas de reporting.

### 5.1 `v_active_trips`

**Objetivo:**
- Listar todos los viajes en curso (`status = 'IN_PROGRESS'`) incluyendo datos del driver y vehículo.

**Columnas clave:**
- `trip_id`, `vehicle_id`, `vehicle_plate`, `driver_id`, `driver_name`, `origin`, `destination`, `started_at`, `status`.

**Uso típico:**
- Dashboard en tiempo real de viajes activos.

---

### 5.2 `v_driver_current_assignment`

**Objetivo:**
- Mostrar la asignación activa (sin `assigned_to`) de cada driver y el vehículo asociado.

**Uso típico:**
- Saber qué conductor está asignado a qué vehículo en este momento.

---

### 5.3 `v_vehicle_last_alert`

**Objetivo:**
- Obtener la última alerta registrada por vehículo.

**Lógica:**
- Subconsulta que busca `MAX(detected_at)` por `vehicle_id` y devuelve solo esa fila.

**Uso típico:**
- Mostrar en un dashboard la "última alerta" de cada vehículo.

---

### 5.4 `v_open_issues`

**Objetivo:**
- Listar incidencias con `status` `OPEN` o `IN_PROGRESS`, incluyendo referencias a vehículo, driver y trip.

**Uso típico:**
- Módulo de tickets / incidencias pendientes.

---

### 5.5 `v_trip_alerts_summary`

**Objetivo:**
- Resumen por viaje:
  - número total de alertas (`total_alerts`)
  - número de alertas severas (`critical_or_high_alerts`)

**Uso típico:**
- Ranking de viajes más críticos.
- Reportes de desempeño de conductores o rutas.

---

### 5.6 `v_vehicle_health`

**Objetivo:**
- Vista agregada del "estado de salud" del vehículo:
  - estado del vehículo (`vehicle_status`)
  - estado del dispositivo (`device_status`, `last_seen_at`)
  - última alerta
  - conteo de issues abiertos

**Uso típico:**
- Dashboard de flota: ver rápido qué vehículos tienen problemas o alertas recientes.

---

## 6. Procedimientos almacenados (`PROCEDUREs`)

Los procedimientos almacenados encapsulan lógica de negocio para que el backend haga llamadas simples.

### 6.1 `sp_start_trip`

**Firma:**
```sql
sp_start_trip(
    IN  p_vehicle_id   BIGINT,
    IN  p_driver_id    BIGINT,
    IN  p_origin       VARCHAR(150),
    IN  p_destination  VARCHAR(150),
    OUT p_trip_id      BIGINT
)
```

**Función:**
- Crear un nuevo viaje con `status = 'IN_PROGRESS'` y `started_at = NOW()`.
- Devolver el `trip_id` generado.

**Uso típico en backend:**
- Cuando el dispositivo o el sistema inicia una sesión de conducción.

---

### 6.2 `sp_end_trip`

**Firma:**
```sql
sp_end_trip(
    IN p_trip_id BIGINT,
    IN p_status  VARCHAR(20)
)
```

**Función:**
- Marcar `ended_at = NOW()` para el viaje.
- Si `p_status` viene vacío/NULL, dejar que el trigger ajuste el estado a `FINISHED` automáticamente.
- Si `p_status` trae un valor (como `CANCELLED`), se usa ese estado.

**Uso típico:**
- Cerrar un viaje cuando el conductor llega a destino o se cancela la ruta.

---

### 6.3 `sp_log_alert`

**Firma:**
```sql
sp_log_alert(
    IN p_trip_id    BIGINT,
    IN p_alert_type VARCHAR(50),
    IN p_severity   VARCHAR(10),
    IN p_message    VARCHAR(255)
)
```

**Función:**
- A partir de `trip_id` consulta `vehicle_id` y `driver_id`.
- Inserta una alerta ligada al viaje, vehículo y driver correcto.

**Uso típico:**
- El servicio de IA o el dispositivo solo necesita enviar `trip_id` y datos de alerta, sin preocuparse por IDs adicionales.

---

### 6.4 `sp_open_issue`

**Firma:**
```sql
sp_open_issue(
    IN p_vehicle_id   BIGINT,
    IN p_driver_id    BIGINT,
    IN p_trip_id      BIGINT,
    IN p_issue_type   VARCHAR(100),
    IN p_description  TEXT
)
```

**Función:**
- Crear una nueva incidencia con `status = 'OPEN'`.

**Uso típico:**
- El backend o un operador registra un problema detectado en un viaje o vehículo.

---

### 6.5 `sp_close_issue`

**Firma:**
```sql
sp_close_issue(
    IN p_issue_id BIGINT
)
```

**Función:**
- Marcar `status = 'CLOSED'` y fijar `resolved_at = NOW()`.

**Uso típico:**
- Cerrar tickets cuando se resuelve el problema.

---

### 6.6 `sp_update_device_status`

**Firma:**
```sql
sp_update_device_status(
    IN p_device_id BIGINT,
    IN p_status    VARCHAR(10),
    IN p_firmware_version VARCHAR(50)
)
```

**Función:**
- Actualizar el estado del dispositivo (ONLINE/OFFLINE/UNKNOWN) y, opcionalmente, versión de firmware.
- El trigger se encarga de ajustar `last_seen_at` cuando el estado se vuelve `ONLINE`.

**Uso típico:**
- Llamado por un servicio que monitorea heartbeats de los dispositivos.

---

## 7. Datos de prueba (`sample data`)

Se incluyó un script `05_sample_data.sql` con:

- 3 drivers
- 3 vehicles
- 2 asignaciones activas
- 3 devices
- 2 trips (uno activo y uno finalizado)
- 3 alerts
- 3 issues

**Objetivo:**
- Permitir pruebas rápidas de consultas, vistas y procedimientos desde Python o cualquier cliente SQL.

---

## 8. Flujo típico de uso (backend)

1. **Config inicial**
   - Crear `drivers`, `vehicles`, `devices`.
   - Generar asignaciones activas en `driver_vehicle_assignments`.

2. **Inicio de viaje**
   - Backend llama a `sp_start_trip(...)`.
   - Obtiene `trip_id` para esa sesión.

3. **Recepción de alertas en tiempo real**
   - Cada evento de IA llama a `sp_log_alert(trip_id, tipo, severidad, mensaje)`.

4. **Cierre de viaje**
   - Backend llama a `sp_end_trip(trip_id, NULL)`.

5. **Gestión de incidencias**
   - Operadores usan `sp_open_issue(...)` y `sp_close_issue(...)`.

6. **Monitor de flota**
   - El panel consulta vistas como `v_active_trips`, `v_vehicle_health`, `v_trip_alerts_summary`.

---

Con esto tienes un diseño de base de datos **coherente, normalizado y listo para producción ligera**, pero también muy cómodo para prototipar desde Python/TypeScript, manteniendo mucha lógica de integridad directamente en MySQL.

