from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from database.autoawake_db import (
    Database,
    log_alert,
    list_alerts_by_trip,
    list_alerts_by_vehicle,
    list_alerts_by_driver
)
from schemas.crud_schemas import AlertLog, AlertResponse
from utils.security import get_current_user
from utils.db_instance import get_db_instance
from services.mqtt_service import mqtt_service
from pydantic import BaseModel

class ControlCommand(BaseModel):
    action: str

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.post("/")
def create_alert(
    alert: AlertLog,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db_instance)
):
    try:
        log_alert(
            db,
            alert.trip_id,
            alert.alert_type,
            alert.severity,
            alert.message
        )
        return {"message": "Alert logged successfully"}
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
    db: Database = Depends(get_db_instance)
):
    return list_alerts_by_trip(db, trip_id, limit)

@router.get("/vehicle/{vehicle_id}", response_model=List[AlertResponse])
def get_alerts_by_vehicle(
    vehicle_id: int,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db_instance)
):
    return list_alerts_by_vehicle(db, vehicle_id, limit)

@router.get("/driver/{driver_id}", response_model=List[AlertResponse])
def get_alerts_by_driver(
    driver_id: int,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db_instance)
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
    db: Database = Depends(get_db_instance)
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
