"""
TransitOps — Driver CRUD router.
Endpoints: create, list (filterable), available pool, get, update, delete.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, require_roles
from ..models import Driver, DriverStatus, User
from ..schemas import DriverCreate, DriverResponse, DriverUpdate

router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.post(
    "",
    response_model=DriverResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("fleet_manager", "safety_officer"))],
)
def create_driver(body: DriverCreate, db: Session = Depends(get_db)):
    """Create a new driver. Rejects duplicate license_number."""
    existing = db.query(Driver).filter(
        Driver.license_number == body.license_number
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver with license number '{body.license_number}' already exists.",
        )

    driver = Driver(
        name=body.name,
        license_number=body.license_number,
        license_category=body.license_category,
        license_expiry_date=body.license_expiry_date,
        contact_number=body.contact_number,
        safety_score=body.safety_score,
    )
    # Apply optional status override
    if body.status:
        try:
            driver.status = DriverStatus(body.status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{body.status}'. Must be one of: {[s.value for s in DriverStatus]}",
            )

    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


@router.get("", response_model=list[DriverResponse])
def list_drivers(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """List drivers with optional filters. Search matches name or license_number."""
    query = db.query(Driver)

    if status:
        query = query.filter(Driver.status == DriverStatus(status))
    if search:
        query = query.filter(
            (Driver.name.ilike(f"%{search}%"))
            | (Driver.license_number.ilike(f"%{search}%"))
        )

    return query.order_by(Driver.created_at.desc()).all()


@router.get("/available/pool", response_model=list[DriverResponse])
def available_driver_pool(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Return drivers where status=Available AND license_expiry_date > now.
    Excludes Suspended, Off Duty, On Trip, and expired-license drivers.
    This is the dropdown source for trip creation.
    """
    now = datetime.now(timezone.utc)
    return (
        db.query(Driver)
        .filter(
            Driver.status == DriverStatus.Available,
            Driver.license_expiry_date > now,
        )
        .order_by(Driver.name)
        .all()
    )


@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Get a single driver by ID."""
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found.")
    return driver


@router.put(
    "/{driver_id}",
    response_model=DriverResponse,
    dependencies=[Depends(require_roles("fleet_manager", "safety_officer"))],
)
def update_driver(
    driver_id: int,
    body: DriverUpdate,
    db: Session = Depends(get_db),
):
    """Partial update — only supplied fields change."""
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found.")

    update_data = body.model_dump(exclude_unset=True)

    # If license_number is being changed, check uniqueness
    if "license_number" in update_data:
        existing = (
            db.query(Driver)
            .filter(
                Driver.license_number == update_data["license_number"],
                Driver.id != driver_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"License number '{update_data['license_number']}' is already in use.",
            )

    # Validate status if provided
    if "status" in update_data and update_data["status"] is not None:
        try:
            update_data["status"] = DriverStatus(update_data["status"])
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {[s.value for s in DriverStatus]}",
            )

    for field, value in update_data.items():
        setattr(driver, field, value)

    db.commit()
    db.refresh(driver)
    return driver


@router.delete("/{driver_id}", status_code=status.HTTP_200_OK)
def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles("fleet_manager", "safety_officer")),
):
    """Delete a driver. Blocked if the driver has trip history — suggest Off Duty/Suspended."""
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found.")

    if driver.trips:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete driver '{driver.name}' — they have {len(driver.trips)} trip(s). "
                   f"Set status to 'Off Duty' or 'Suspended' instead.",
        )

    db.delete(driver)
    db.commit()
    return {"detail": f"Driver '{driver.name}' deleted successfully."}
