from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from core.deps import get_current_user, get_db
from database.autoawake_db import (
    Database,
    start_trip,
    end_trip,
    get_trip_by_id,
    list_trips_by_driver,
    list_trips_by_vehicle,
    create_trip_plan,
    list_trip_plans,
)
from schemas.crud_schemas import TripStart, TripEnd, TripResponse, TripPlanCreate, TripPlanResponse

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.get("/", response_model=List[TripResponse])
def list_all_trips(
    status: str = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    """
    Lista todos los viajes, opcionalmente filtrados por estado
    """
    if status:
        query = """
            SELECT 
                t.*,
                CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
                v.plate AS vehicle_plate,
                v.brand AS vehicle_brand,
                v.model AS vehicle_model
            FROM trips t
            JOIN drivers d ON d.driver_id = t.driver_id
            JOIN vehicles v ON v.vehicle_id = t.vehicle_id
            WHERE t.status = %s
            ORDER BY t.started_at DESC
            LIMIT %s
        """
        return db.fetch_all(query, (status, limit))
    
    query = """
        SELECT 
            t.*,
            CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
            v.plate AS vehicle_plate,
            v.brand AS vehicle_brand,
            v.model AS vehicle_model
        FROM trips t
        JOIN drivers d ON d.driver_id = t.driver_id
        JOIN vehicles v ON v.vehicle_id = t.vehicle_id
        ORDER BY t.started_at DESC
        LIMIT %s
    """
    return db.fetch_all(query, (limit,))


@router.post("/plans", response_model=TripPlanResponse)
def create_plan(
    plan: TripPlanCreate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    try:
        plan_id = create_trip_plan(db, plan.driver_id, plan.vehicle_id, plan.origin, plan.destination)
        plans = list_trip_plans(db, active_only=False)
        created = next((p for p in plans if p["plan_id"] == plan_id), None)
        if not created:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo recuperar el plan creado",
            )
        return created
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/plans", response_model=List[TripPlanResponse])
def list_plans(
    active_only: bool = False,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    return list_trip_plans(db, active_only)

@router.post("/", response_model=TripResponse)
def start_new_trip(
    trip: TripStart,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
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
    db: Database = Depends(get_db),
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
    db: Database = Depends(get_db),
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
    db: Database = Depends(get_db),
):
    return list_trips_by_driver(db, driver_id, limit)

@router.get("/vehicle/{vehicle_id}", response_model=List[TripResponse])
def get_trips_by_vehicle(
    vehicle_id: int,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    return list_trips_by_vehicle(db, vehicle_id, limit)

@router.get("/stats/active")
def get_active_trips_stats(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    """
    Obtiene estadísticas de viajes activos con alertas de somnolencia
    """
    query = """
        SELECT 
            t.trip_id,
            t.driver_id,
            t.vehicle_id,
            t.started_at,
            t.origin,
            t.destination,
            CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
            v.plate AS vehicle_plate,
            v.brand,
            v.model,
            COUNT(DISTINCT CASE WHEN a.severity IN ('CRITICAL', 'HIGH') THEN a.alert_id END) AS critical_alerts,
            COUNT(DISTINCT a.alert_id) AS total_alerts,
            MAX(a.detected_at) AS last_alert_time,
            TIMESTAMPDIFF(MINUTE, t.started_at, NOW()) AS duration_minutes
        FROM trips t
        JOIN drivers d ON d.driver_id = t.driver_id
        JOIN vehicles v ON v.vehicle_id = t.vehicle_id
        LEFT JOIN alerts a ON a.trip_id = t.trip_id
        WHERE t.status = 'IN_PROGRESS'
        GROUP BY t.trip_id, t.driver_id, t.vehicle_id, t.started_at, t.origin, 
                 t.destination, d.first_name, d.last_name, v.plate, v.brand, v.model
        ORDER BY critical_alerts DESC, total_alerts DESC
    """
    
    active_trips = db.fetch_all(query)
    
    # Calcular estadísticas generales
    total_active = len(active_trips)
    drivers_alert = sum(1 for trip in active_trips if trip['critical_alerts'] > 0)
    drivers_ok = total_active - drivers_alert
    
    return {
        "total_active_trips": total_active,
        "drivers_alert": drivers_alert,
        "drivers_ok": drivers_ok,
        "active_trips": active_trips
    }
