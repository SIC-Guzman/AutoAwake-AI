from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from core.deps import get_current_user, get_db
from database.autoawake_db import (
    Database,
    log_alert,
    list_alerts_by_trip,
    list_alerts_by_vehicle,
    list_alerts_by_driver,
    start_trip,
    end_trip,
    get_active_trip_by_pair,
    get_driver_by_full_name,
    get_vehicle_by_plate,
    consume_trip_plan,
)
from schemas.crud_schemas import AlertLog, AlertResponse
from services.mqtt_service import mqtt_service
from services.telegram_service import telegram_service
from pydantic import BaseModel

class ControlCommand(BaseModel):
    action: str

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.post("/")
def create_alert(
    alert: AlertLog,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    """
    Maneja alertas normales y el modo especial TRIP:
    - Si alert_type == "TRIP" y viene driver/vehicle, inicia/termina viaje y registra alerta.
    - Si viene trip_id, registra la alerta normal.
    """
    try:
        if alert.alert_type == "TRIP":
            driver_id = alert.driver_id
            vehicle_id = alert.vehicle_id
            if not driver_id and alert.driver_name:
                driver = get_driver_by_full_name(db, alert.driver_name)
                driver_id = driver["driver_id"] if driver else None
            if not vehicle_id and alert.vehicle_plate:
                vehicle = get_vehicle_by_plate(db, alert.vehicle_plate)
                vehicle_id = vehicle["vehicle_id"] if vehicle else None

            if not (driver_id and vehicle_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="driver_id/driver_name y vehicle_id/vehicle_plate son necesarios para TRIP",
                )

            active_trip = get_active_trip_by_pair(db, driver_id, vehicle_id)
            if active_trip:
                end_trip(db, active_trip["trip_id"], None)
                trip_id = active_trip["trip_id"]
                action_msg = alert.message or "Trip finalizado automáticamente por alerta TRIP"
            else:
                plan = consume_trip_plan(db, driver_id, vehicle_id)
                origin = alert.origin or (plan["origin"] if plan else "Origen automático")
                destination = alert.destination or (plan["destination"] if plan else "Destino asignado")
                trip_id = start_trip(db, vehicle_id, driver_id, origin, destination)
                action_msg = alert.message or "Trip iniciado automáticamente por alerta TRIP"

            log_alert(db, trip_id, "TRIP", alert.severity, action_msg)
            telegram_service.send_alert(
                db,
                "TRIP",
                alert.severity,
                action_msg,
                trip_id,
            )
            return {"message": "TRIP alert processed", "trip_id": trip_id}

        if not alert.trip_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="trip_id es requerido para registrar alertas normales",
            )

        log_alert(
            db,
            alert.trip_id,
            alert.alert_type,
            alert.severity,
            alert.message
        )
        telegram_service.send_alert(
            db,
            alert.alert_type,
            alert.severity,
            alert.message,
            alert.trip_id,
        )
        return {"message": "Alert logged successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/trip/{trip_id}", response_model=List[AlertResponse])
def get_alerts_by_trip(
    trip_id: int,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    return list_alerts_by_trip(db, trip_id, limit)

@router.get("/vehicle/{vehicle_id}", response_model=List[AlertResponse])
def get_alerts_by_vehicle(
    vehicle_id: int,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    return list_alerts_by_vehicle(db, vehicle_id, limit)

@router.get("/driver/{driver_id}", response_model=List[AlertResponse])
def get_alerts_by_driver(
    driver_id: int,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    return list_alerts_by_driver(db, driver_id, limit)

@router.get("/", response_model=List[AlertResponse])
def get_all_alerts(
    driver_id: int = None,
    vehicle_id: int = None,
    start_date: str = None,
    end_date: str = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    """
    Obtiene alertas con filtros opcionales.
    """
    try:
        conditions = []
        params = []

        if driver_id:
            conditions.append("a.driver_id = %s")
            params.append(driver_id)

        if vehicle_id:
            conditions.append("a.vehicle_id = %s")
            params.append(vehicle_id)

        if start_date:
            conditions.append("a.detected_at >= %s")
            params.append(start_date)

        if end_date:
            conditions.append("a.detected_at <= %s")
            params.append(end_date)

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        query = f"""
            SELECT
                a.*,
                CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
                v.plate AS vehicle_plate
            FROM alerts a
            JOIN drivers d ON d.driver_id = a.driver_id
            JOIN vehicles v ON v.vehicle_id = a.vehicle_id
            WHERE {where_clause}
            ORDER BY a.detected_at DESC
            LIMIT %s
        """
        params.append(limit)

        return db.fetch_all(query, tuple(params))
    except Exception as e:
        print(f"Error in get_all_alerts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching alerts: {str(e)}"
        )

@router.post("/control/apagar_buzzer")
def control_apagar_buzzer(
    current_user: dict = Depends(get_current_user)
):
    try:
        mqtt_service.publish_control("apagar_buzzer")
        return {"message": "Command 'apagar_buzzer' sent"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/control/encender_buzzer")
def control_encender_buzzer(
    current_user: dict = Depends(get_current_user)
):
    try:
        mqtt_service.publish_control("encender_buzzer")
        return {"message": "Command 'encender_buzzer' sent"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/control/apagar_led")
def control_apagar_led(
    current_user: dict = Depends(get_current_user)
):
    try:
        mqtt_service.publish_control("apagar_led")
        return {"message": "Command 'apagar_led' sent"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/control/encender_led")
def control_encender_led(
    current_user: dict = Depends(get_current_user)
):
    try:
        mqtt_service.publish_control("encender_led")
        return {"message": "Command 'encender_led' sent"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
