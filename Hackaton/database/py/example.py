from autoawake_db import (
    DBConfig,
    Database,
    get_user_by_email,
    get_users_view,
    list_active_sessions,
    login_user,
    register_user,
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

    # -------- USUARIOS / LOGIN --------
    email = "admin@autoawake.ai"
    password = "admin123"

    existing_user = get_user_by_email(db, email)
    if existing_user:
        user_id = existing_user["user_id"]
        print(f"Usuario ya existe con ID: {user_id}")
    else:
        user_id = register_user(db, "Admin AutoAwake", email, password, role_name="ADMIN")
        print(f"Usuario creado con ID: {user_id}")

    session_data = login_user(db, email, password)
    print(f"Login OK. Token: {session_data['session_token']}, rol: {session_data['role_name']}")

    # -------- DRIVER --------
    license_number = "LIC-1000"

    existing_driver = get_driver_by_license(db, license_number)
    if existing_driver:
        driver_id = existing_driver["driver_id"]
        print(f"Driver ya existía con ID: {driver_id}")
    else:
        driver_id = create_driver(db, "Juan", "Pérez", license_number)
        print(f"Driver creado con ID: {driver_id}")

    # -------- VEHÍCULO --------
    plate = "P999XYZ"

    existing_vehicle = get_vehicle_by_plate(db, plate)
    if existing_vehicle:
        vehicle_id = existing_vehicle["vehicle_id"]
        print(f"Vehículo ya existía con ID: {vehicle_id}")
    else:
        vehicle_id = create_vehicle(db, plate, "Toyota", "Hilux")
        print(f"Vehículo creado con ID: {vehicle_id}")

    # -------- VIAJE --------
    trip_id = start_trip(db, vehicle_id, driver_id, "Planta Central", "Bodega Norte")
    print(f"Viaje iniciado con ID: {trip_id}")

    # -------- ALERTA --------
    log_alert(db, trip_id, "DROWSINESS", "HIGH", "Ojos cerrados 3s")
    print("Alerta registrada")

    # -------- FIN DEL VIAJE --------
    end_trip(db, trip_id, status=None)
    print("Viaje finalizado")

    # -------- DASHBOARD --------
    print("Viajes activos:", get_active_trips(db))
    print("Salud de la flota:", get_vehicle_health(db))
    print("Usuarios:", get_users_view(db))
    print("Sesiones activas:", list_active_sessions(db))


if __name__ == "__main__":
    demo()
