"""
TransitOps — Driver CRUD router.
Endpoints: create, list (filterable, paginated), available pool, get, update, delete.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, require_roles
from ..models import Driver, DriverStatus, User
from ..schemas import DriverCreate, DriverResponse, DriverUpdate, ExpiringDriverResponse

router = APIRouter(prefix="/drivers", tags=["Drivers"])


class PaginatedDrivers(BaseModel):
    items: List[DriverResponse]
    total: int
    skip: int
    limit: int


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


@router.get("", response_model=PaginatedDrivers)
def list_drivers(
    status: Optional[DriverStatus] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None, description="Field to sort by: name, status, safety_score, license_expiry_date, created_at"),
    sort_order: Optional[str] = Query("asc", description="asc or desc"),
    skip: int = Query(0, ge=0, description="Number of records to skip (pagination offset)"),
    limit: int = Query(20, ge=1, le=200, description="Max records to return per page"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """List drivers with optional filters, sorting and pagination."""
    query = db.query(Driver)

    if status:
        query = query.filter(Driver.status == status)
    if search:
        query = query.filter(
            (Driver.name.ilike(f"%{search}%"))
            | (Driver.license_number.ilike(f"%{search}%"))
        )

    # Sorting
    sort_field_map = {
        "name": Driver.name,
        "status": Driver.status,
        "safety_score": Driver.safety_score,
        "license_expiry_date": Driver.license_expiry_date,
        "created_at": Driver.created_at,
    }
    sort_col = sort_field_map.get(sort_by, Driver.created_at)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return PaginatedDrivers(items=items, total=total, skip=skip, limit=limit)


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
    # Use timezone-aware datetime for consistent comparison
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


@router.get("/expiring-licenses", response_model=list[ExpiringDriverResponse])
def expiring_licenses(
    days: int = Query(30, ge=0, description="Return drivers whose license expires within this many days (default 30)."),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Return drivers whose license expires within `days` days (or is already expired).
    Useful for the Safety Officer role to surface compliance alerts.
    Results are sorted by license_expiry_date ascending (soonest first).
    """
    # Use timezone-aware datetime for consistent comparison
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(days=days)
    drivers = (
        db.query(Driver)
        .filter(Driver.license_expiry_date <= cutoff)
        .order_by(Driver.license_expiry_date.asc())
        .all()
    )

    result = []
    for d in drivers:
        expiry = d.license_expiry_date
        # Normalize expiry to timezone-aware for comparison
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        delta = (expiry - now).days  # negative = already expired
        result.append(
            ExpiringDriverResponse(
                **{col.key: getattr(d, col.key) for col in Driver.__table__.columns},
                days_until_expiry=delta,
            )
        )
    return result


@router.post(
    "/send-expiry-reminders",
    dependencies=[Depends(require_roles("fleet_manager", "safety_officer"))],
)
def send_expiry_reminders(
    days: int = Query(30, ge=0, description="Send reminders for drivers whose license expires within this many days."),
    recipient_email: str = Query(..., description="Email address to send reminders to."),
    db: Session = Depends(get_db),
):
    """
    Manually trigger email reminders for drivers with expiring licenses.
    Sends one email per driver to the specified recipient_email.
    Returns a summary of sent/failed emails.
    """
    from ..email_service import is_smtp_configured, send_license_expiry_reminder

    # Use timezone-aware datetime for consistent comparison
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(days=days)
    drivers = (
        db.query(Driver)
        .filter(Driver.license_expiry_date <= cutoff)
        .order_by(Driver.license_expiry_date.asc())
        .all()
    )

    if not drivers:
        return {
            "detail": "No drivers with expiring licenses found within the specified period.",
            "total": 0,
            "sent": 0,
            "failed": 0,
        }

    if not is_smtp_configured():
        return {
            "detail": "SMTP is not configured. Set TRANSITOPS_SMTP_* environment variables to enable email.",
            "smtp_configured": False,
            "total": len(drivers),
            "sent": 0,
            "failed": 0,
            "drivers": [
                {
                    "name": d.name,
                    "license_number": d.license_number,
                    "expiry_date": d.license_expiry_date.isoformat(),
                    "days_until_expiry": (
                        (d.license_expiry_date.replace(tzinfo=timezone.utc) if d.license_expiry_date.tzinfo is None else d.license_expiry_date) - now
                    ).days,
                }
                for d in drivers
            ],
        }

    sent = 0
    failed = 0
    for d in drivers:
        expiry = d.license_expiry_date
        # Normalize expiry to timezone-aware
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        days_until = (expiry - now).days
        success = send_license_expiry_reminder(
            driver_name=d.name,
            license_number=d.license_number,
            expiry_date=d.license_expiry_date.strftime("%Y-%m-%d"),
            days_until=days_until,
            to_email=recipient_email,
        )
        if success:
            sent += 1
        else:
            failed += 1

    return {
        "detail": f"Processed {len(drivers)} driver(s). Sent: {sent}, Failed: {failed}.",
        "total": len(drivers),
        "sent": sent,
        "failed": failed,
    }


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
