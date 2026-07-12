"""
TransitOps — Pydantic v2 request/response schemas for every entity.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ── Auth Schemas ─────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr  # Enforce valid email format
    password: str = Field(
        min_length=8,  # Increased from 6 to 8
        description="Password must be at least 8 characters with uppercase, lowercase, number, and special character"
    )
    full_name: str = Field(min_length=1, max_length=100)
    role: str  # UserRole value


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    driver_id: Optional[int] = None


# ── Vehicle Schemas ──────────────────────────────────────────────────────────

class VehicleCreate(BaseModel):
    registration_number: str = Field(min_length=1)
    name_model: str = Field(min_length=1)
    type: str = Field(min_length=1)
    max_load_capacity: float = Field(gt=0)
    odometer: float = Field(default=0, ge=0)
    acquisition_cost: float = Field(ge=0)
    status: Optional[str] = None  # defaults to Available
    region: Optional[str] = None


class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = None
    name_model: Optional[str] = None
    type: Optional[str] = None
    max_load_capacity: Optional[float] = Field(default=None, gt=0)
    odometer: Optional[float] = Field(default=None, ge=0)
    acquisition_cost: Optional[float] = Field(default=None, ge=0)
    status: Optional[str] = None
    region: Optional[str] = None


class VehicleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    registration_number: str
    name_model: str
    type: str
    max_load_capacity: float
    odometer: float
    acquisition_cost: float
    status: str
    region: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# ── Driver Schemas ───────────────────────────────────────────────────────────

class DriverCreate(BaseModel):
    name: str = Field(min_length=1)
    license_number: str = Field(min_length=1)
    license_category: str = Field(min_length=1)
    license_expiry_date: datetime
    contact_number: str = Field(min_length=1)
    safety_score: float = Field(default=100.0)
    status: Optional[str] = None  # defaults to Available


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_number: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry_date: Optional[datetime] = None
    contact_number: Optional[str] = None
    safety_score: Optional[float] = None
    status: Optional[str] = None


class DriverResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    license_number: str
    license_category: str
    license_expiry_date: datetime
    contact_number: str
    safety_score: float
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class ExpiringDriverResponse(DriverResponse):
    """DriverResponse extended with days_until_expiry for the license-alert endpoint."""
    days_until_expiry: int  # negative means already expired


# ── Trip Schemas ─────────────────────────────────────────────────────────────

class TripCreate(BaseModel):
    source: str = Field(min_length=1)
    destination: str = Field(min_length=1)
    vehicle_id: int
    driver_id: int
    cargo_weight: float = Field(gt=0)
    planned_distance: float = Field(gt=0)
    revenue: float = Field(default=0.0, ge=0)


class TripCompleteRequest(BaseModel):
    final_odometer: float = Field(gt=0)
    fuel_consumed: float = Field(ge=0)
    revenue: Optional[float] = Field(default=None, ge=0)


class TripResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: float
    planned_distance: float
    actual_distance: Optional[float] = None
    fuel_consumed: Optional[float] = None
    revenue: float
    status: str
    created_by_id: Optional[int] = None
    created_at: datetime
    dispatched_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None


# ── Maintenance Schemas ──────────────────────────────────────────────────────

class MaintenanceCreate(BaseModel):
    vehicle_id: int
    description: str = Field(min_length=1)
    cost: float = Field(default=0.0, ge=0)


class MaintenanceCloseRequest(BaseModel):
    final_cost: Optional[float] = Field(default=None, ge=0)


class MaintenanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    description: str
    cost: float
    status: str
    created_at: datetime
    closed_at: Optional[datetime] = None


# ── Fuel Log Schemas ─────────────────────────────────────────────────────────

class FuelLogCreate(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    liters: float = Field(gt=0)
    cost: float = Field(ge=0)


class FuelLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    trip_id: Optional[int] = None
    liters: float
    cost: float
    date: datetime


# ── Expense Schemas ──────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    type: str  # ExpenseType value
    amount: float = Field(gt=0)
    description: Optional[str] = None


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    trip_id: Optional[int] = None
    type: str
    amount: float
    date: datetime
    description: Optional[str] = None


# ── Analytics Schemas ────────────────────────────────────────────────────────

class DashboardKPIs(BaseModel):
    active_vehicles: int
    available_vehicles: int
    vehicles_in_maintenance: int
    on_trip_vehicles: int          # vehicles currently On Trip
    active_trips: int
    pending_trips: int
    drivers_on_duty: int
    fleet_utilization_percent: float


class VehicleAnalytics(BaseModel):
    vehicle_id: int
    registration_number: str
    name_model: str
    type: str
    status: str
    acquisition_cost: float
    total_distance: float
    total_fuel_liters: float
    total_fuel_cost: float
    fuel_efficiency: Optional[float] = None
    total_maintenance_cost: float
    total_operational_cost: float
    revenue: float
    roi: Optional[float] = None


# ── Vehicle Document Schemas ─────────────────────────────────────────────────

class VehicleDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    document_type: str
    file_name: str
    file_path: str
    uploaded_by_id: Optional[int] = None
    expiry_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime


class VehicleDocumentUpdate(BaseModel):
    document_type: Optional[str] = None
    expiry_date: Optional[datetime] = None
    notes: Optional[str] = None
