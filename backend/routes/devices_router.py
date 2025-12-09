from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from database.autoawake_db import (
    Database,
    update_device_status,
    list_devices,
    get_device_by_id
)
from schemas.crud_schemas import DeviceStatusUpdate, DeviceResponse
from utils.db_instance import get_db_instance

router = APIRouter(prefix="/devices", tags=["Devices"])

@router.put("/{device_id}/status")
def update_status(
    device_id: int,
    status_update: DeviceStatusUpdate,
    db: Database = Depends(get_db_instance)
):
    try:
        update_device_status(
            db,
            device_id,
            status_update.status,
            status_update.firmware_version
        )
        return {"message": "Device status updated successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/", response_model=List[DeviceResponse])
def get_all_devices(
    status: str = None,
    db: Database = Depends(get_db_instance)
):
    return list_devices(db, status)
