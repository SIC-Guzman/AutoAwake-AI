from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from database.autoawake_db import (
    Database,
    log_alert,
    list_alerts_by_trip
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
