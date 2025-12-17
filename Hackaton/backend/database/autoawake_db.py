"""
autoawake_db.py

Capa de acceso a datos para la base de datos AutoAwakeAI (MySQL).

Usa:
- Tablas: drivers, vehicles, driver_vehicle_assignments, trips,
          alerts, issues, devices, roles, users, user_sessions
- Vistas: v_active_trips, v_driver_current_assignment, v_vehicle_last_alert,
          v_open_issues, v_trip_alerts_summary, v_vehicle_health,
          v_users, v_active_sessions
- SPs:   sp_start_trip, sp_end_trip, sp_log_alert,
         sp_open_issue, sp_close_issue, sp_update_device_status,
         sp_register_user, sp_login_user, sp_logout_session
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple

import os
import mysql.connector
from mysql.connector import Error, pooling


# =====================================================
# 1. Configuración y clase base de conexión
# =====================================================

@dataclass
class DBConfig:
    host: str = os.getenv("DB_HOST", "localhost")
    port: int = int(os.getenv("DB_PORT", "3306"))
    user: str = os.getenv("DB_USER", "autoawake_user")
    password: str = os.getenv("DB_PASS", "super_secret")
    database: str = os.getenv("DB_NAME", "AutoAwakeAI")
    pool_name: str = "autoawake_pool"
    pool_size: int = 5


class Database:
    """
    Wrapper simple sobre mysql-connector con pool.
    """

    def __init__(self, config: Optional[DBConfig] = None) -> None:
        self.config = config or DBConfig()
        try:
            self.pool = pooling.MySQLConnectionPool(
                pool_name=self.config.pool_name,
                pool_size=self.config.pool_size,
                pool_reset_session=True,
                host=self.config.host,
                port=self.config.port,
                user=self.config.user,
                password=self.config.password,
                database=self.config.database,
            )
        except Error as e:
            raise RuntimeError(f"Error creando pool de conexiones: {e}") from e

    # -----------------------------
    # Métodos internos de utilidad
    # -----------------------------
    def _get_connection(self):
        try:
            return self.pool.get_connection()
        except Error as e:
            raise RuntimeError(f"No se pudo obtener conexión del pool: {e}") from e

    # -----------------------------
    # SELECT genéricos
    # -----------------------------
    def fetch_one(
        self,
        query: str,
        params: Optional[Tuple[Any, ...]] = None,
    ) -> Optional[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            with conn.cursor(dictionary=True) as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchone()
        finally:
            conn.close()

    def fetch_all(
        self,
        query: str,
        params: Optional[Tuple[Any, ...]] = None,
    ) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            with conn.cursor(dictionary=True) as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchall()
        finally:
            conn.close()

    # -----------------------------
    # INSERT/UPDATE/DELETE genéricos
    # -----------------------------
    def execute(
        self,
        query: str,
        params: Optional[Tuple[Any, ...]] = None,
        *,
        commit: bool = True,
        return_lastrowid: bool = False,
    ) -> Optional[int]:
        conn = self._get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, params or ())
                if commit:
                    conn.commit()
                if return_lastrowid:
                    return cursor.lastrowid
                return None
        finally:
            conn.close()

    def executemany(
        self,
        query: str,
        param_list: Iterable[Tuple[Any, ...]],
        *,
        commit: bool = True,
    ) -> None:
        conn = self._get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.executemany(query, list(param_list))
                if commit:
                    conn.commit()
        finally:
            conn.close()

    # -----------------------------
    # Stored Procedures
    # -----------------------------
    def call_procedure(
        self,
        name: str,
        args: Optional[List[Any]] = None,
    ) -> Tuple[List[Any], List[List[Dict[str, Any]]]]:
        """
        Llama un SP y devuelve:
          (lista_args_modificados, [resultset1, resultset2, ...])

        args debe ser una lista (NO tupla) para poder leer OUT params.
        """
        conn = self._get_connection()
        try:
            with conn.cursor(dictionary=True) as cursor:
                proc_args = args or []
                result = cursor.callproc(name, proc_args)
                result_sets: List[List[Dict[str, Any]]] = []
                for rs in cursor.stored_results():
                    result_sets.append(rs.fetchall())
                conn.commit()
                return list(result), result_sets
        finally:
            conn.close()

    # -----------------------------
    # Vistas
    # -----------------------------
    def select_from_view(
        self,
        view_name: str,
        where_clause: str = "",
        params: Optional[Tuple[Any, ...]] = None,
    ) -> List[Dict[str, Any]]:
        query = f"SELECT * FROM {view_name} {where_clause}"
        return self.fetch_all(query, params)


# =====================================================
# 2. Funciones para entidades base
# =====================================================

# ---------------------------
# USERS & AUTH
# ---------------------------

def register_user(
    db: Database,
    full_name: str,
    email: str,
    password_plain: str,
    role_name: str = "DRIVER",
) -> int:
    """
    Crea un usuario usando sp_register_user (hash+salt en BD).
    """
    args: List[Any] = [full_name, email, password_plain, role_name, 0]
    result_args, _ = db.call_procedure("sp_register_user", args)
    user_id = result_args[4]
    return int(user_id)


def login_user(
    db: Database,
    email: str,
    password_plain: str,
) -> Dict[str, Any]:
    """
    Ejecuta sp_login_user y devuelve user_id, role_name y session_token.
    """
    args: List[Any] = [email, password_plain, 0, "", ""]
    result_args, _ = db.call_procedure("sp_login_user", args)
    return {
        "user_id": int(result_args[2]),
        "role_name": result_args[3],
        "session_token": result_args[4],
    }


def logout_session(db: Database, session_token: str) -> None:
    db.call_procedure("sp_logout_session", [session_token])


def get_user_by_email(db: Database, email: str) -> Optional[Dict[str, Any]]:
    query = "SELECT * FROM users WHERE email = %s"
    return db.fetch_one(query, (email.lower(),))


def list_users(db: Database, status: Optional[str] = None) -> List[Dict[str, Any]]:
    if status:
        query = "SELECT * FROM users WHERE status = %s ORDER BY created_at DESC"
        return db.fetch_all(query, (status,))
    query = "SELECT * FROM users ORDER BY created_at DESC"
    return db.fetch_all(query)


def get_active_session(db: Database, token: str) -> Optional[Dict[str, Any]]:
    """
    Recupera una sesión activa (no expirada ni revocada) y datos del usuario.
    """
    query = """
        SELECT
            s.session_id,
            s.user_id,
            s.token,
            s.created_at,
            s.expires_at,
            u.full_name,
            u.email,
            u.status,
            r.name AS role_name
        FROM user_sessions s
        JOIN users u ON u.user_id = s.user_id
        JOIN roles r ON r.role_id = u.role_id
        WHERE s.token = %s
          AND s.revoked_at IS NULL
          AND s.expires_at > NOW()
        LIMIT 1
    """
    return db.fetch_one(query, (token,))

# ---------------------------
# DRIVERS
# ---------------------------

def create_driver(
    db: Database,
    first_name: str,
    last_name: str,
    license_number: str,
    status: str = "ACTIVE",
) -> int:
    """
    Inserta un driver en la tabla drivers.
    """
    query = """
        INSERT INTO drivers (first_name, last_name, license_number, status)
        VALUES (%s, %s, %s, %s)
    """
    params = (first_name, last_name, license_number, status)
    new_id = db.execute(query, params, return_lastrowid=True)
    return new_id or 0


def get_driver_by_id(db: Database, driver_id: int) -> Optional[Dict[str, Any]]:
    query = "SELECT * FROM drivers WHERE driver_id = %s"
    return db.fetch_one(query, (driver_id,))


def get_driver_by_license(db: Database, license_number: str) -> Optional[Dict[str, Any]]:
    query = "SELECT * FROM drivers WHERE license_number = %s"
    return db.fetch_one(query, (license_number,))


def list_drivers(db: Database, status: Optional[str] = None) -> List[Dict[str, Any]]:
    if status:
        query = "SELECT * FROM drivers WHERE status = %s ORDER BY first_name, last_name"
        return db.fetch_all(query, (status,))
    query = "SELECT * FROM drivers ORDER BY first_name, last_name"
    return db.fetch_all(query)


def deactivate_driver(db: Database, driver_id: int) -> None:
    query = "UPDATE drivers SET status = 'INACTIVE' WHERE driver_id = %s"
    db.execute(query, (driver_id,))


def update_driver(
    db: Database,
    driver_id: int,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    license_number: Optional[str] = None,
    status: Optional[str] = None,
) -> None:
    """
    Actualiza los campos del conductor especificado.
    Solo actualiza los campos que no sean None.
    """
    fields = []
    params = []
    
    if first_name is not None:
        fields.append("first_name = %s")
        params.append(first_name)
    if last_name is not None:
        fields.append("last_name = %s")
        params.append(last_name)
    if license_number is not None:
        fields.append("license_number = %s")
        params.append(license_number)
    if status is not None:
        fields.append("status = %s")
        params.append(status)
    
    if not fields:
        return  # No hay campos para actualizar
    
    params.append(driver_id)
    query = f"UPDATE drivers SET {', '.join(fields)} WHERE driver_id = %s"
    db.execute(query, tuple(params))


# ---------------------------
# VEHICLES
# ---------------------------

def create_vehicle(
    db: Database,
    plate: str,
    brand: str,
    model: str,
    status: str = "ACTIVE",
) -> int:
    query = """
        INSERT INTO vehicles (plate, brand, model, status)
        VALUES (%s, %s, %s, %s)
    """
    params = (plate, brand, model, status)
    new_id = db.execute(query, params, return_lastrowid=True)
    return new_id or 0


def get_vehicle_by_id(db: Database, vehicle_id: int) -> Optional[Dict[str, Any]]:
    query = "SELECT * FROM vehicles WHERE vehicle_id = %s"
    return db.fetch_one(query, (vehicle_id,))


def get_vehicle_by_plate(db: Database, plate: str) -> Optional[Dict[str, Any]]:
    query = "SELECT * FROM vehicles WHERE plate = %s"
    return db.fetch_one(query, (plate,))


def list_vehicles(db: Database, status: Optional[str] = None) -> List[Dict[str, Any]]:
    if status:
        query = "SELECT * FROM vehicles WHERE status = %s ORDER BY plate"
        return db.fetch_all(query, (status,))
    query = "SELECT * FROM vehicles ORDER BY plate"
    return db.fetch_all(query)


def update_vehicle_status(db: Database, vehicle_id: int, status: str) -> None:
    query = "UPDATE vehicles SET status = %s WHERE vehicle_id = %s"
    db.execute(query, (status, vehicle_id))


# ---------------------------
# DRIVER_VEHICLE_ASSIGNMENTS
# ---------------------------

def create_assignment(
    db: Database,
    driver_id: int,
    vehicle_id: int,
    assigned_from_now: bool = True,
    assigned_from: Optional[str] = None,
) -> int:
    """
    Crea una asignación driver-vehicle.
    - Si assigned_from_now=True => usa NOW() en SQL.
    - Deja assigned_to = NULL para marcarla como activa.
    OJO: los triggers en la tabla impiden múltiples asignaciones
    activas para el mismo driver/vehicle.
    """
    if assigned_from_now:
        query = """
            INSERT INTO driver_vehicle_assignments (
                driver_id, vehicle_id, assigned_from, assigned_to
            )
            VALUES (%s, %s, NOW(), NULL)
        """
        params = (driver_id, vehicle_id)
    else:
        if assigned_from is None:
            raise ValueError("assigned_from debe tener valor si assigned_from_now=False")
        query = """
            INSERT INTO driver_vehicle_assignments (
                driver_id, vehicle_id, assigned_from, assigned_to
            )
            VALUES (%s, %s, %s, NULL)
        """
        params = (driver_id, vehicle_id, assigned_from)

    new_id = db.execute(query, params, return_lastrowid=True)
    return new_id or 0


def close_assignment(
    db: Database,
    assignment_id: int,
    assigned_to_now: bool = True,
    assigned_to: Optional[str] = None,
) -> None:
    if assigned_to_now:
        query = """
            UPDATE driver_vehicle_assignments
            SET assigned_to = NOW()
            WHERE assignment_id = %s
        """
        params = (assignment_id,)
    else:
        if assigned_to is None:
            raise ValueError("assigned_to debe tener valor si assigned_to_now=False")
        query = """
            UPDATE driver_vehicle_assignments
            SET assigned_to = %s
            WHERE assignment_id = %s
        """
        params = (assigned_to, assignment_id)

    db.execute(query, params)


def get_current_assignment_by_driver(
    db: Database,
    driver_id: int,
) -> Optional[Dict[str, Any]]:
    """
    Usa la vista v_driver_current_assignment para obtener
    la asignación activa de un driver.
    """
    rows = db.select_from_view(
        "v_driver_current_assignment",
        "WHERE driver_id = %s",
        (driver_id,),
    )
    return rows[0] if rows else None


def get_current_assignment_by_vehicle(
    db: Database,
    vehicle_id: int,
) -> Optional[Dict[str, Any]]:
    rows = db.select_from_view(
        "v_driver_current_assignment",
        "WHERE vehicle_id = %s",
        (vehicle_id,),
    )
    return rows[0] if rows else None


def list_assignments(
    db: Database,
    active_only: bool = False
) -> List[Dict[str, Any]]:
    """
    Lista todas las asignaciones driver-vehicle con información detallada.
    Si active_only=True, solo devuelve las asignaciones activas (assigned_to IS NULL).
    """
    if active_only:
        query = """
            SELECT 
                dva.assignment_id,
                dva.driver_id,
                CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
                d.license_number,
                d.status AS driver_status,
                dva.vehicle_id,
                v.plate AS vehicle_plate,
                v.brand,
                v.model,
                v.status AS vehicle_status,
                dva.assigned_from,
                dva.assigned_to
            FROM driver_vehicle_assignments dva
            JOIN drivers d ON d.driver_id = dva.driver_id
            JOIN vehicles v ON v.vehicle_id = dva.vehicle_id
            WHERE dva.assigned_to IS NULL
            ORDER BY dva.assigned_from DESC
        """
    else:
        query = """
            SELECT 
                dva.assignment_id,
                dva.driver_id,
                CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
                d.license_number,
                d.status AS driver_status,
                dva.vehicle_id,
                v.plate AS vehicle_plate,
                v.brand,
                v.model,
                v.status AS vehicle_status,
                dva.assigned_from,
                dva.assigned_to
            FROM driver_vehicle_assignments dva
            JOIN drivers d ON d.driver_id = dva.driver_id
            JOIN vehicles v ON v.vehicle_id = dva.vehicle_id
            ORDER BY dva.assigned_from DESC
        """
    
    return db.fetch_all(query)


# ---------------------------
# TRIPS (usando SPs)
# ---------------------------

def start_trip(
    db: Database,
    vehicle_id: int,
    driver_id: int,
    origin: str,
    destination: str,
) -> int:
    """
    Llama a sp_start_trip y devuelve el trip_id generado.

    Nota:
    - Algunos drivers de MySQL (como mysql-connector-python) devuelven
      strings tipo 'sp_start_trip_arg5' en los OUT params.
    - Para evitar depender de eso, después de llamar al SP buscamos
      el viaje recién creado en la tabla trips.
    """
    # 1. Llamamos al SP (ignoramos el OUT param)
    args = [vehicle_id, driver_id, origin, destination, 0]
    db.call_procedure("sp_start_trip", args)

    # 2. Recuperamos el viaje más reciente de ese driver/vehículo
    row = db.fetch_one(
        """
        SELECT trip_id
        FROM trips
        WHERE vehicle_id = %s
          AND driver_id  = %s
        ORDER BY started_at DESC
        LIMIT 1
        """,
        (vehicle_id, driver_id),
    )

    if not row or "trip_id" not in row:
        raise RuntimeError(
            "No se pudo recuperar el trip_id recién creado después de sp_start_trip."
        )

    return int(row["trip_id"])



def end_trip(
    db: Database,
    trip_id: int,
    status: Optional[str] = None,
) -> None:
    """
    Llama a sp_end_trip.
    Si status es None, el trigger ajusta IN_PROGRESS -> FINISHED.
    """
    args = [trip_id, status]
    db.call_procedure("sp_end_trip", args)


def get_trip_by_id(db: Database, trip_id: int) -> Optional[Dict[str, Any]]:
    query = "SELECT * FROM trips WHERE trip_id = %s"
    return db.fetch_one(query, (trip_id,))


def list_trips_by_driver(
    db: Database,
    driver_id: int,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    query = """
        SELECT *
        FROM trips
        WHERE driver_id = %s
        ORDER BY started_at DESC
        LIMIT %s
    """
    return db.fetch_all(query, (driver_id, limit))


def list_trips_by_vehicle(
    db: Database,
    vehicle_id: int,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    query = """
        SELECT *
        FROM trips
        WHERE vehicle_id = %s
        ORDER BY started_at DESC
        LIMIT %s
    """
    return db.fetch_all(query, (vehicle_id, limit))


# ---------------------------
# ALERTS (SP + consultas)
# ---------------------------

def log_alert(
    db: Database,
    trip_id: int,
    alert_type: str,
    severity: str,
    message: str,
) -> None:
    """
    Llama a sp_log_alert.
    SP resuelve vehicle_id y driver_id a partir de trip_id.
    """
    args = [trip_id, alert_type, severity, message]
    db.call_procedure("sp_log_alert", args)


def list_alerts_by_trip(
    db: Database,
    trip_id: int,
    limit: int = 100,
) -> List[Dict[str, Any]]:
    query = """
        SELECT 
            a.*,
            CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
            v.plate AS vehicle_plate
        FROM alerts a
        JOIN drivers d ON d.driver_id = a.driver_id
        JOIN vehicles v ON v.vehicle_id = a.vehicle_id
        WHERE a.trip_id = %s
        ORDER BY a.detected_at DESC
        LIMIT %s
    """
    return db.fetch_all(query, (trip_id, limit))


def list_alerts_by_vehicle(
    db: Database,
    vehicle_id: int,
    limit: int = 100,
) -> List[Dict[str, Any]]:
    query = """
        SELECT 
            a.*,
            CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
            v.plate AS vehicle_plate
        FROM alerts a
        JOIN drivers d ON d.driver_id = a.driver_id
        JOIN vehicles v ON v.vehicle_id = a.vehicle_id
        WHERE a.vehicle_id = %s
        ORDER BY a.detected_at DESC
        LIMIT %s
    """
    return db.fetch_all(query, (vehicle_id, limit))


def list_alerts_by_driver(
    db: Database,
    driver_id: int,
    limit: int = 100,
) -> List[Dict[str, Any]]:
    query = """
        SELECT 
            a.*,
            CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
            v.plate AS vehicle_plate
        FROM alerts a
        JOIN drivers d ON d.driver_id = a.driver_id
        JOIN vehicles v ON v.vehicle_id = a.vehicle_id
        WHERE a.driver_id = %s
        ORDER BY a.detected_at DESC
        LIMIT %s
    """
    return db.fetch_all(query, (driver_id, limit))


# ---------------------------
# ISSUES (SP + consultas)
# ---------------------------

def open_issue(
    db: Database,
    vehicle_id: Optional[int],
    driver_id: Optional[int],
    trip_id: Optional[int],
    issue_type: str,
    description: str,
) -> None:
    """
    Llama a sp_open_issue.
    Los FKs pueden ir NULL dependiendo del tipo de issue.
    """
    args = [
        vehicle_id,
        driver_id,
        trip_id,
        issue_type,
        description,
    ]
    db.call_procedure("sp_open_issue", args)


def update_issue_status(
    db: Database,
    issue_id: int,
    new_status: str,
) -> None:
    """Update issue status to IN_PROGRESS or CLOSED"""
    query = "UPDATE issues SET status = %s WHERE issue_id = %s"
    if new_status == 'CLOSED':
        query = "UPDATE issues SET status = 'CLOSED', resolved_at = NOW() WHERE issue_id = %s"
        db.execute(query, (issue_id,))
    else:
        db.execute(query, (new_status, issue_id,))

def close_issue(
    db: Database,
    issue_id: int,
) -> None:
    db.call_procedure("sp_close_issue", [issue_id])


def list_issues(
    db: Database,
    status: Optional[str] = None,
    limit: int = 100,
) -> List[Dict[str, Any]]:
    if status:
        query = """
            SELECT 
                i.issue_id,
                i.vehicle_id,
                i.driver_id,
                i.trip_id,
                i.issue_type,
                i.description,
                i.status,
                i.reported_at,
                i.resolved_at,
                CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
                v.plate AS vehicle_plate,
                v.brand AS vehicle_brand,
                v.model AS vehicle_model
            FROM issues i
            LEFT JOIN drivers d ON i.driver_id = d.driver_id
            LEFT JOIN vehicles v ON i.vehicle_id = v.vehicle_id
            WHERE i.status = %s
            ORDER BY i.reported_at DESC
            LIMIT %s
        """
        return db.fetch_all(query, (status, limit))
    query = """
        SELECT 
            i.issue_id,
            i.vehicle_id,
            i.driver_id,
            i.trip_id,
            i.issue_type,
            i.description,
            i.status,
            i.reported_at,
            i.resolved_at,
            CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
            v.plate AS vehicle_plate,
            v.brand AS vehicle_brand,
            v.model AS vehicle_model
        FROM issues i
        LEFT JOIN drivers d ON i.driver_id = d.driver_id
        LEFT JOIN vehicles v ON i.vehicle_id = v.vehicle_id
        ORDER BY i.reported_at DESC
        LIMIT %s
    """
    return db.fetch_all(query, (limit,))


# ---------------------------
# DEVICES (SP + consultas)
# ---------------------------

def update_device_status(
    db: Database,
    device_id: int,
    status: str,
    firmware_version: Optional[str] = None,
) -> None:
    """
    Llama a sp_update_device_status.
    El trigger ajusta last_seen_at cuando status = ONLINE.
    """
    args = [device_id, status, firmware_version]
    db.call_procedure("sp_update_device_status", args)


def get_device_by_id(db: Database, device_id: int) -> Optional[Dict[str, Any]]:
    query = "SELECT * FROM devices WHERE device_id = %s"
    return db.fetch_one(query, (device_id,))


def list_devices(db: Database, status: Optional[str] = None) -> List[Dict[str, Any]]:
    if status:
        query = "SELECT * FROM devices WHERE status = %s ORDER BY vehicle_id"
        return db.fetch_all(query, (status,))
    query = "SELECT * FROM devices ORDER BY vehicle_id"
    return db.fetch_all(query)


# =====================================================
# 3. Funciones para vistas (dashboards)
# =====================================================

def get_active_trips(db: Database) -> List[Dict[str, Any]]:
    """
    v_active_trips: viajes IN_PROGRESS con datos de driver y vehículo.
    """
    return db.select_from_view("v_active_trips")


def get_vehicle_last_alert(
    db: Database,
    vehicle_id: Optional[int] = None,
) -> List[Dict[str, Any]]:
    if vehicle_id is None:
        return db.select_from_view("v_vehicle_last_alert")
    return db.select_from_view(
        "v_vehicle_last_alert",
        "WHERE vehicle_id = %s",
        (vehicle_id,),
    )


def get_open_issues_view(
    db: Database,
    vehicle_id: Optional[int] = None,
) -> List[Dict[str, Any]]:
    if vehicle_id is None:
        return db.select_from_view("v_open_issues")
    return db.select_from_view(
        "v_open_issues",
        "WHERE vehicle_id = %s",
        (vehicle_id,),
    )


def get_trip_alerts_summary(
    db: Database,
    trip_id: Optional[int] = None,
) -> List[Dict[str, Any]]:
    if trip_id is None:
        return db.select_from_view("v_trip_alerts_summary")
    return db.select_from_view(
        "v_trip_alerts_summary",
        "WHERE trip_id = %s",
        (trip_id,),
    )


def get_vehicle_health(
    db: Database,
    vehicle_id: Optional[int] = None,
) -> List[Dict[str, Any]]:
    if vehicle_id is None:
        return db.select_from_view("v_vehicle_health")
    return db.select_from_view(
        "v_vehicle_health",
        "WHERE vehicle_id = %s",
        (vehicle_id,),
    )


def get_users_view(
    db: Database,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    v_users: listado de usuarios con rol.
    """
    if status:
        return db.select_from_view("v_users", "WHERE status = %s", (status,))
    return db.select_from_view("v_users")


def list_active_sessions(db: Database) -> List[Dict[str, Any]]:
    """
    v_active_sessions: sesiones vigentes con datos de usuario/rol.
    """
    return db.select_from_view("v_active_sessions")
