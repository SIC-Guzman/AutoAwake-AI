 
# AutoAwakeAI - Documentación del módulo Python para la base de datos

Este documento explica el uso del módulo `autoawake_db.py`, el cual proporciona una capa de acceso a datos (Data Access Layer) para la base de datos AutoAwakeAI. Incluye conexión, consultas, manejo de entidades, vistas y stored procedures.

## 1. Instalación

Instalar el conector MySQL para Python.

```bash
pip install mysql-connector-python
```

Se recomienda tener la siguiente estructura en el proyecto:

```
/database
    /py
        autoawake_db.py
        example.py
    /sql
        01_schema.sql
        02_triggers.sql
        03_views.sql
        04_procedures.sql
        05_sample_data.sql
```

## 2. Configuración de conexión

El módulo utiliza `DBConfig` para la configuración y `Database` para crear el pool de conexiones.

```python
config = DBConfig(
    host="localhost",
    user="autoawake_user",
    password="super_secret",
    database="AutoAwakeAI",
)

db = Database(config)
```

Esto inicializa un pool reutilizable para todas las operaciones de acceso a la base de datos.

## 3. Estructura del módulo `autoawake_db.py`

El módulo contiene:

1. Clase `Database`, que implementa:

   * Métodos de conexión
   * Ejecución de consultas SELECT, INSERT, UPDATE, DELETE
   * Ejecución de procedimientos almacenados
   * Acceso a vistas

2. Funciones por entidad para:

   * drivers
   * vehicles
   * driver_vehicle_assignments
   * trips
   * alerts
   * issues
   * devices

3. Funciones auxiliares para vistas:

   * v_active_trips
   * v_vehicle_last_alert
   * v_open_issues
   * v_trip_alerts_summary
   * v_vehicle_health

Cada función corresponde directamente con las tablas y SPs definidos en la base de datos.

## 4. Uso por entidad

A continuación se describen las operaciones soportadas para cada tipo de entidad.

### 4.1 Drivers

Funciones principales:

```python
create_driver(db, first_name, last_name, license_number, status)
get_driver_by_id(db, driver_id)
get_driver_by_license(db, license_number)
list_drivers(db, status)
deactivate_driver(db, driver_id)
```

Ejemplo:

```python
driver_id = create_driver(db, "Juan", "Pérez", "LIC-9001")
```

### 4.2 Vehicles

Funciones principales:

```python
create_vehicle(db, plate, brand, model, status)
get_vehicle_by_id(db, vehicle_id)
get_vehicle_by_plate(db, plate)
list_vehicles(db, status)
update_vehicle_status(db, vehicle_id, status)
```

Ejemplo:

```python
vehicle_id = create_vehicle(db, "P123XYZ", "Toyota", "Hilux")
```

### 4.3 Asignaciones Driver-Vehicle

```python
create_assignment(db, driver_id, vehicle_id)
close_assignment(db, assignment_id)
get_current_assignment_by_driver(db, driver_id)
get_current_assignment_by_vehicle(db, vehicle_id)
```

Las asignaciones son controladas por triggers que evitan asignaciones duplicadas activas.

### 4.4 Trips (viajes) mediante stored procedures

```python
start_trip(db, vehicle_id, driver_id, origin, destination)
end_trip(db, trip_id, status)
get_trip_by_id(db, trip_id)
list_trips_by_driver(db, driver_id)
list_trips_by_vehicle(db, vehicle_id)
```

Ejemplo:

```python
trip_id = start_trip(db, vehicle_id, driver_id, "Planta Central", "Bodega Norte")
```

### 4.5 Alerts (alertas)

```python
log_alert(db, trip_id, alert_type, severity, message)
list_alerts_by_trip(db, trip_id)
list_alerts_by_vehicle(db, vehicle_id)
list_alerts_by_driver(db, driver_id)
```

Ejemplo:

```python
log_alert(db, trip_id, "DROWSINESS", "HIGH", "Ojos cerrados 3s")
```

### 4.6 Issues (fallas)

```python
open_issue(db, vehicle_id, driver_id, trip_id, issue_type, description)
close_issue(db, issue_id)
list_issues(db, status)
```

### 4.7 Devices

```python
update_device_status(db, device_id, status, firmware_version)
get_device_by_id(db, device_id)
list_devices(db, status)
```

## 5. Uso de vistas

El módulo expone funciones específicas para consultar vistas de dashboard.

```python
get_active_trips(db)
get_vehicle_last_alert(db, vehicle_id)
get_open_issues_view(db, vehicle_id)
get_trip_alerts_summary(db, trip_id)
get_vehicle_health(db, vehicle_id)
```

Ejemplo:

```python
active_trips = get_active_trips(db)
```

## 6. Ejemplo completo de uso

```python
from autoawake_db import (
    DBConfig,
    Database,
    create_driver,
    get_driver_by_license,
    create_vehicle,
    get_vehicle_by_plate,
    start_trip,
    log_alert,
    end_trip,
    get_active_trips,
    get_vehicle_health,
)

def demo():
    db = Database(DBConfig(
        host="localhost",
        user="autoawake_user",
        password="super_secret",
        database="AutoAwakeAI",
    ))

    license_number = "LIC-9999"
    driver = get_driver_by_license(db, license_number)
    driver_id = driver["driver_id"] if driver else create_driver(db, "Juan", "Pérez", license_number)

    plate = "P999XYZ"
    vehicle = get_vehicle_by_plate(db, plate)
    vehicle_id = vehicle["vehicle_id"] if vehicle else create_vehicle(db, plate, "Toyota", "Hilux")

    trip_id = start_trip(db, vehicle_id, driver_id, "Planta Central", "Bodega Norte")
    log_alert(db, trip_id, "DROWSINESS", "HIGH", "Ojos cerrados 3s")
    end_trip(db, trip_id)

    print(get_active_trips(db))
    print(get_vehicle_health(db))

if __name__ == "__main__":
    demo()
```

## 7. Buenas prácticas

1. Utilizar funciones get_* antes de create_* cuando los datos pueden existir.
2. Preferir vistas para consultas de dashboard.
3. No insertar manualmente datos controlados por triggers.
4. Usar funciones específicas para cada stored procedure.
5. Mantener `autoawake_db.py` como capa de acceso a datos centralizada.
