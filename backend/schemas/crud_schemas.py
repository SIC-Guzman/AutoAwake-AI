from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

# --- DRIVER SCHEMAS ---
class DriverCreate(BaseModel):
    first_name: str
    last_name: str
    license_number: str
    status: Optional[str] = "ACTIVE"

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

# --- ALERT SCHEMAS ---
class AlertLog(BaseModel):
    trip_id: int
    alert_type: str
    severity: str
    message: str

class AlertResponse(BaseModel):
    alert_id: int
    trip_id: int
    vehicle_id: int
    driver_id: int
    alert_type: str
    severity: str
    message: str
    detected_at: datetime

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
