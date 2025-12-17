from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

# --- DRIVER SCHEMAS ---
class DriverCreate(BaseModel):
    first_name: str
    last_name: str
    license_number: str
    status: Optional[str] = "ACTIVE"

class DriverUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    license_number: Optional[str] = None
    status: Optional[str] = None

class DriverResponse(DriverCreate):
    driver_id: int

# --- VEHICLE SCHEMAS ---
class VehicleCreate(BaseModel):
    plate: str
    brand: str
    model: str
    status: Optional[str] = "ACTIVE"

class VehicleResponse(VehicleCreate):
    vehicle_id: int

class VehicleStatusUpdate(BaseModel):
    status: str

# --- ASSIGNMENT SCHEMAS ---
class AssignmentCreate(BaseModel):
    driver_id: int
    vehicle_id: int

class AssignmentResponse(BaseModel):
    assignment_id: int
    driver_id: int
    driver_name: str
    license_number: str
    driver_status: str
    vehicle_id: int
    vehicle_plate: str
    brand: str
    model: str
    vehicle_status: str
    assigned_from: datetime
    assigned_to: Optional[datetime] = None

# --- TRIP SCHEMAS ---
class TripStart(BaseModel):
    vehicle_id: int
    driver_id: int
    origin: str
    destination: str

class TripEnd(BaseModel):
    status: Optional[str] = None

class TripResponse(BaseModel):
    trip_id: int
    vehicle_id: int
    driver_id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    origin: str
    destination: str
    status: str
    driver_name: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None

    class Config:
        from_attributes = True


# --- TRIP PLAN SCHEMAS ---
class TripPlanCreate(BaseModel):
    driver_id: int
    vehicle_id: int
    origin: str
    destination: str


class TripPlanResponse(TripPlanCreate):
    plan_id: int
    is_active: int
    created_at: datetime
    used_at: Optional[datetime] = None
    driver_name: Optional[str] = None
    license_number: Optional[str] = None
    vehicle_plate: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None

# --- ALERT SCHEMAS ---
class AlertLog(BaseModel):
    trip_id: Optional[int] = None
    alert_type: str
    severity: str
    message: str
    driver_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    driver_name: Optional[str] = None
    vehicle_plate: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None

class AlertResponse(BaseModel):
    alert_id: int
    trip_id: int
    vehicle_id: int
    driver_id: int
    alert_type: str
    severity: str
    message: str
    detected_at: datetime
    driver_name: Optional[str] = None
    vehicle_plate: Optional[str] = None

    class Config:
        from_attributes = True

# --- ISSUE SCHEMAS ---
class IssueOpen(BaseModel):
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    trip_id: Optional[int] = None
    issue_type: str
    description: str

class IssueResponse(BaseModel):
    issue_id: int
    vehicle_id: Optional[int]
    driver_id: Optional[int]
    trip_id: Optional[int]
    issue_type: str
    description: str
    status: str
    reported_at: datetime
    resolved_at: Optional[datetime]
    driver_name: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None

    class Config:
        from_attributes = True

# --- DEVICE SCHEMAS ---
class DeviceStatusUpdate(BaseModel):
    status: str
    firmware_version: Optional[str] = None

class DeviceResponse(BaseModel):
    device_id: int
    vehicle_id: int
    device_type: str
    serial_number: str
    firmware_version: str
    status: str
    last_seen_at: Optional[datetime]
    vehicle_plate: Optional[str] = None
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None

    class Config:
        from_attributes = True
