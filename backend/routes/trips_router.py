from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from database.autoawake_db import (
    Database,
    start_trip,
    end_trip,
    get_trip_by_id,
    list_trips_by_driver,
    list_trips_by_vehicle
)
from schemas.crud_schemas import TripStart, TripEnd, TripResponse
from utils.security import get_current_user
from utils.db_instance import get_db_instance

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.post("/", response_model=TripResponse)
def start_new_trip(
    trip: TripStart,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db_instance)
):
    try:
        trip_id = start_trip(
            db,
            trip.vehicle_id,
            trip.driver_id,
            trip.origin,
            trip.destination
        )
        # Fetch the created trip to return full details
        created_trip = get_trip_by_id(db, trip_id)
        return created_trip
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{trip_id}/end")
def end_current_trip(
    trip_id: int,
    trip_end: TripEnd,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db_instance)
):
    try:
        end_trip(db, trip_id, trip_end.status)
        return {"message": "Trip ended successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: int,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db_instance)
):
    trip = get_trip_by_id(db, trip_id)
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    return trip

@router.get("/driver/{driver_id}", response_model=List[TripResponse])
def get_trips_by_driver(
    driver_id: int,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db_instance)
):
    return list_trips_by_driver(db, driver_id, limit)

@router.get("/vehicle/{vehicle_id}", response_model=List[TripResponse])
def get_trips_by_vehicle(
    vehicle_id: int,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db_instance)
):
    return list_trips_by_vehicle(db, vehicle_id, limit)
