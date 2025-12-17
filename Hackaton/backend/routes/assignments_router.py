from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from core.deps import get_current_user, get_db
from database.autoawake_db import (
    Database,
    create_assignment,
    close_assignment,
    list_assignments,
    get_current_assignment_by_driver,
    get_current_assignment_by_vehicle,
)
from schemas.crud_schemas import AssignmentCreate, AssignmentResponse

router = APIRouter(prefix="/assignments", tags=["Assignments"])

@router.post("/", response_model=AssignmentResponse)
def create_new_assignment(
    assignment: AssignmentCreate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    """
    Crea una nueva asignación de conductor-vehículo.
    """
    try:
        # Verificar si el conductor ya tiene una asignación activa
        current_driver_assignment = get_current_assignment_by_driver(db, assignment.driver_id)
        if current_driver_assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El conductor ya tiene una asignación activa con el vehículo {current_driver_assignment['vehicle_plate']}"
            )
        
        # Verificar si el vehículo ya tiene una asignación activa
        current_vehicle_assignment = get_current_assignment_by_vehicle(db, assignment.vehicle_id)
        if current_vehicle_assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El vehículo ya está asignado al conductor {current_vehicle_assignment['driver_name']}"
            )
        
        assignment_id = create_assignment(
            db,
            assignment.driver_id,
            assignment.vehicle_id
        )
        
        # Obtener la asignación creada con toda la información
        assignments = list_assignments(db, active_only=True)
        created_assignment = next((a for a in assignments if a['assignment_id'] == assignment_id), None)
        
        if not created_assignment:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al recuperar la asignación creada"
            )
        
        return created_assignment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/", response_model=List[AssignmentResponse])
def get_all_assignments(
    active_only: bool = False,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    """
    Obtiene todas las asignaciones con información detallada de conductores y vehículos.
    Si active_only=true, solo devuelve asignaciones activas.
    """
    return list_assignments(db, active_only)

@router.get("/driver/{driver_id}", response_model=AssignmentResponse)
def get_driver_current_assignment(
    driver_id: int,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    """
    Obtiene la asignación activa de un conductor específico.
    """
    assignment = get_current_assignment_by_driver(db, driver_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El conductor no tiene una asignación activa"
        )
    return assignment

@router.get("/vehicle/{vehicle_id}", response_model=AssignmentResponse)
def get_vehicle_current_assignment(
    vehicle_id: int,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    """
    Obtiene la asignación activa de un vehículo específico.
    """
    assignment = get_current_assignment_by_vehicle(db, vehicle_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El vehículo no tiene una asignación activa"
        )
    return assignment

@router.put("/{assignment_id}/close")
def close_driver_assignment(
    assignment_id: int,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    """
    Cierra una asignación existente (marca assigned_to con NOW()).
    """
    try:
        close_assignment(db, assignment_id)
        return {"message": "Asignación cerrada exitosamente"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
