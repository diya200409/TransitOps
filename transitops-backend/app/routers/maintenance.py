"""
TransitOps — Maintenance router.
Create/close maintenance records with automatic vehicle status transitions.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, require_roles
from ..models import (
    MaintenanceRecord,
    MaintenanceStatus,
    User,
    Vehicle,
    VehicleStatus,
)
from ..schemas import MaintenanceCloseRequest, MaintenanceCreate, MaintenanceResponse

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


@router.post(
    "",
    response_model=MaintenanceResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("fleet_manager"))],
)
def create_maintenance(body: MaintenanceCreate, db: Session = Depends(get_db)):
    """
    Create a maintenance record.
    - Rejects if vehicle is On Trip.
    - Auto-flips vehicle to In Shop (unless Retired).
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == body.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

    if vehicle.status == VehicleStatus.On_Trip:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot create maintenance for vehicle '{vehicle.registration_number}' — it is currently On Trip.",
        )

    record = MaintenanceRecord(
        vehicle_id=body.vehicle_id,
        description=body.description,
        cost=body.cost,
        status=MaintenanceStatus.Open,
    )
    db.add(record)

    # Auto-flip vehicle to In Shop (unless Retired)
    if vehicle.status != VehicleStatus.Retired:
        vehicle.status = VehicleStatus.In_Shop

    db.commit()
    db.refresh(record)
    return record


@router.post(
    "/{record_id}/close",
    response_model=MaintenanceResponse,
    dependencies=[Depends(require_roles("fleet_manager"))],
)
def close_maintenance(
    record_id: int,
    body: MaintenanceCloseRequest = MaintenanceCloseRequest(),
    db: Session = Depends(get_db),
):
    """
    Close a maintenance record with database locking to prevent race conditions.
    - Optionally update cost.
    - Auto-restore vehicle to Available only if:
      (a) vehicle is not Retired, AND
      (b) no OTHER still-Open maintenance record exists on the same vehicle.
    """
    # Lock the maintenance record to prevent concurrent closure
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).with_for_update().first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found.")

    if record.status == MaintenanceStatus.Closed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This maintenance record is already Closed.",
        )

    # Optional cost correction
    if body.final_cost is not None:
        record.cost = body.final_cost

    record.status = MaintenanceStatus.Closed
    record.closed_at = datetime.now(timezone.utc)

    # Auto-restore vehicle to Available — but check conditions with row locking
    vehicle = db.query(Vehicle).filter(Vehicle.id == record.vehicle_id).with_for_update().first()
    if vehicle and vehicle.status != VehicleStatus.Retired:
        # Check if any OTHER Open maintenance records exist for this vehicle
        other_open = (
            db.query(MaintenanceRecord)
            .filter(
                MaintenanceRecord.vehicle_id == record.vehicle_id,
                MaintenanceRecord.id != record_id,
                MaintenanceRecord.status == MaintenanceStatus.Open,
            )
            .first()
        )
        if not other_open:
            vehicle.status = VehicleStatus.Available

    db.commit()
    db.refresh(record)
    return record


@router.get("", response_model=list[MaintenanceResponse])
def list_maintenance(
    vehicle_id: Optional[int] = Query(None),
    status: Optional[MaintenanceStatus] = Query(None),
    sort_by: Optional[str] = Query(None, description="Field to sort by: status, cost, created_at, closed_at"),
    sort_order: Optional[str] = Query("desc", description="asc or desc"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """List maintenance records with optional filters and sorting."""
    query = db.query(MaintenanceRecord)

    if vehicle_id:
        query = query.filter(MaintenanceRecord.vehicle_id == vehicle_id)
    if status:
        query = query.filter(MaintenanceRecord.status == status)

    # Sorting
    sort_field_map = {
        "status": MaintenanceRecord.status,
        "cost": MaintenanceRecord.cost,
        "created_at": MaintenanceRecord.created_at,
        "closed_at": MaintenanceRecord.closed_at,
    }
    sort_col = sort_field_map.get(sort_by, MaintenanceRecord.created_at)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    return query.all()


@router.get("/{record_id}", response_model=MaintenanceResponse)
def get_maintenance(
    record_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Get a single maintenance record by ID."""
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found.")
    return record
