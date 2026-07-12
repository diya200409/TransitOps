"""
TransitOps — Trip Management router.
Lifecycle: Draft → Dispatched → Completed, or → Cancelled.
Handles all dispatch validations and automatic vehicle/driver status transitions.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, require_roles
from ..models import (
    Driver,
    DriverStatus,
    Trip,
    TripStatus,
    User,
    Vehicle,
    VehicleStatus,
)
from ..schemas import TripCompleteRequest, TripCreate, TripResponse

router = APIRouter(prefix="/trips", tags=["Trips"])


# ── Shared Validation ────────────────────────────────────────────────────────

def _validate_trip_resources(
    vehicle: Vehicle,
    driver: Driver,
    cargo_weight: float,
    db: Session,
) -> None:
    """
    Validate vehicle and driver eligibility for a trip.
    Used at both creation (Draft) and dispatch time (state may have changed).
    Raises HTTPException 400 on any violation.
    """
    errors: list[str] = []

    # Vehicle checks
    if vehicle.status == VehicleStatus.Retired:
        errors.append(f"Vehicle '{vehicle.registration_number}' is Retired.")
    elif vehicle.status == VehicleStatus.In_Shop:
        errors.append(f"Vehicle '{vehicle.registration_number}' is In Shop (maintenance).")
    elif vehicle.status == VehicleStatus.On_Trip:
        errors.append(f"Vehicle '{vehicle.registration_number}' is already On Trip.")

    # Driver checks
    if driver.status == DriverStatus.Suspended:
        errors.append(f"Driver '{driver.name}' is Suspended.")
    elif driver.status == DriverStatus.On_Trip:
        errors.append(f"Driver '{driver.name}' is already On Trip.")
    elif driver.status == DriverStatus.Off_Duty:
        errors.append(f"Driver '{driver.name}' is Off Duty.")

    # License expiry
    now = datetime.now(timezone.utc)
    if driver.license_expiry_date <= now:
        errors.append(
            f"Driver '{driver.name}' has an expired license "
            f"(expired {driver.license_expiry_date.strftime('%Y-%m-%d')})."
        )

    # Cargo weight vs capacity
    if cargo_weight > vehicle.max_load_capacity:
        errors.append(
            f"Cargo weight ({cargo_weight} kg) exceeds vehicle "
            f"'{vehicle.registration_number}' max capacity ({vehicle.max_load_capacity} kg)."
        )

    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=" | ".join(errors),
        )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=TripResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_trip(
    body: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("fleet_manager", "driver")),
):
    """
    Create a trip in Draft status.
    Validates vehicle/driver eligibility and cargo weight immediately.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == body.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

    driver = db.query(Driver).filter(Driver.id == body.driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found.")

    _validate_trip_resources(vehicle, driver, body.cargo_weight, db)

    trip = Trip(
        source=body.source,
        destination=body.destination,
        vehicle_id=body.vehicle_id,
        driver_id=body.driver_id,
        cargo_weight=body.cargo_weight,
        planned_distance=body.planned_distance,
        revenue=body.revenue,
        status=TripStatus.Draft,
        created_by_id=current_user.id,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.post("/{trip_id}/dispatch", response_model=TripResponse)
def dispatch_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles("fleet_manager", "driver")),
):
    """
    Dispatch a Draft trip.
    Re-runs all validations (state may have changed since creation).
    Sets vehicle and driver to On Trip.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")

    if trip.status != TripStatus.Draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Trip can only be dispatched from Draft status. Current status: {trip.status.value}.",
        )

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    # Re-validate — state may have changed since Draft was created
    _validate_trip_resources(vehicle, driver, trip.cargo_weight, db)

    # State transitions
    vehicle.status = VehicleStatus.On_Trip
    driver.status = DriverStatus.On_Trip
    trip.status = TripStatus.Dispatched
    trip.dispatched_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(trip)
    return trip


@router.post("/{trip_id}/complete", response_model=TripResponse)
def complete_trip(
    trip_id: int,
    body: TripCompleteRequest,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles("fleet_manager", "driver")),
):
    """
    Complete a Dispatched trip.
    Computes actual_distance from odometer delta.
    Restores vehicle and driver to Available.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")

    if trip.status != TripStatus.Dispatched:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Trip can only be completed from Dispatched status. Current status: {trip.status.value}.",
        )

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    # Validate odometer
    if body.final_odometer <= vehicle.odometer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Final odometer ({body.final_odometer}) must be greater than current "
                   f"vehicle odometer ({vehicle.odometer}).",
        )

    # Compute actual distance
    trip.actual_distance = body.final_odometer - vehicle.odometer

    # Update vehicle odometer
    vehicle.odometer = body.final_odometer

    # Store completion data
    trip.fuel_consumed = body.fuel_consumed
    if body.revenue is not None:
        trip.revenue = body.revenue

    # State transitions — restore to Available
    vehicle.status = VehicleStatus.Available
    driver.status = DriverStatus.Available
    trip.status = TripStatus.Completed
    trip.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(trip)
    return trip


@router.post("/{trip_id}/cancel", response_model=TripResponse)
def cancel_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles("fleet_manager", "driver")),
):
    """
    Cancel a trip (from Draft or Dispatched).
    If Dispatched, restores vehicle and driver to Available.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")

    if trip.status not in (TripStatus.Draft, TripStatus.Dispatched):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Trip can only be cancelled from Draft or Dispatched status. "
                   f"Current status: {trip.status.value}.",
        )

    # If Dispatched, resources were held — release them
    if trip.status == TripStatus.Dispatched:
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
        vehicle.status = VehicleStatus.Available
        driver.status = DriverStatus.Available

    trip.status = TripStatus.Cancelled
    trip.cancelled_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(trip)
    return trip


@router.get("", response_model=list[TripResponse])
def list_trips(
    status: Optional[str] = Query(None),
    vehicle_id: Optional[int] = Query(None),
    driver_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """List trips with optional filters."""
    query = db.query(Trip)

    if status:
        query = query.filter(Trip.status == TripStatus(status))
    if vehicle_id:
        query = query.filter(Trip.vehicle_id == vehicle_id)
    if driver_id:
        query = query.filter(Trip.driver_id == driver_id)

    return query.order_by(Trip.created_at.desc()).all()


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Get a single trip by ID."""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    return trip
