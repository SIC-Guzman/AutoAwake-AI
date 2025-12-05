from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from database.autoawake_db import (
    Database,
    create_driver,
    get_driver_by_id,
    list_drivers,
    deactivate_driver
)
from schemas.crud_schemas import DriverCreate, DriverResponse
from utils.security import get_current_user
from utils.db_instance import get_db_instance

router = APIRouter(prefix="/drivers", tags=["Drivers"])

@router.post("/", response_model=DriverResponse)
def create_new_driver(
    driver: DriverCreate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db_instance)
):
    try:
        driver_id = create_driver(
            db,
            driver.first_name,
            driver.last_name,
            driver.license_number,
            driver.status
        )
        return {
            "driver_id": driver_id,
            **driver.dict()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(
    driver_id: int,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db_instance)
):
    driver = get_driver_by_id(db, driver_id)
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )
    return driver

@router.get("/", response_model=List[DriverResponse])
def get_all_drivers(
    status: str = None,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db_instance)
):
    return list_drivers(db, status)

@router.delete("/{driver_id}")
def delete_driver(
    driver_id: int,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db_instance)
):
    driver = get_driver_by_id(db, driver_id)
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )
    deactivate_driver(db, driver_id)
    return {"message": "Driver deactivated successfully"}
