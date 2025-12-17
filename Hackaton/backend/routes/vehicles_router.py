from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from core.deps import get_current_user, get_db
from database.autoawake_db import (
    Database,
    create_vehicle,
    get_vehicle_by_id,
    list_vehicles,
    update_vehicle_status,
)
from schemas.crud_schemas import VehicleCreate, VehicleResponse, VehicleStatusUpdate

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.post("/", response_model=VehicleResponse)
def create_new_vehicle(
    vehicle: VehicleCreate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    try:
        vehicle_id = create_vehicle(
            db,
            vehicle.plate,
            vehicle.brand,
            vehicle.model,
            vehicle.status
        )
        return {
            "vehicle_id": vehicle_id,
            **vehicle.dict()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: int,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    vehicle = get_vehicle_by_id(db, vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    return vehicle

@router.get("/", response_model=List[VehicleResponse])
def get_all_vehicles(
    status: str = None,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    return list_vehicles(db, status)

@router.put("/{vehicle_id}/status")
def update_status(
    vehicle_id: int,
    status_update: VehicleStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    vehicle = get_vehicle_by_id(db, vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    update_vehicle_status(db, vehicle_id, status_update.status)
    return {"message": "Vehicle status updated successfully"}
