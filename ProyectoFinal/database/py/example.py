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


if __name__ == "__main__":
    demo()
