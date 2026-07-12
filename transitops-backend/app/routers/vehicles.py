"""
TransitOps — Vehicle CRUD router.
Endpoints: create, list (filterable, paginated), available pool, get, update, delete.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, require_roles
from ..models import User, Vehicle, VehicleStatus
from ..schemas import VehicleCreate, VehicleResponse, VehicleUpdate

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


class PaginatedVehicles(BaseModel):
    items: List[VehicleResponse]
    total: int
    skip: int
    limit: int


@router.post(
    "",
    response_model=VehicleResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("fleet_manager"))],
)
def create_vehicle(body: VehicleCreate, db: Session = Depends(get_db)):
    """Create a new vehicle. Rejects duplicate registration_number."""
    # Check duplicate registration_number before insert
    existing = db.query(Vehicle).filter(
        Vehicle.registration_number == body.registration_number
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle with registration number '{body.registration_number}' already exists.",
        )

    vehicle = Vehicle(
        registration_number=body.registration_number,
        name_model=body.name_model,
        type=body.type,
        max_load_capacity=body.max_load_capacity,
        odometer=body.odometer,
        acquisition_cost=body.acquisition_cost,
        region=body.region,
    )
    # Apply optional status override
    if body.status:
        try:
            vehicle.status = VehicleStatus(body.status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{body.status}'. Must be one of: {[s.value for s in VehicleStatus]}",
            )

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("", response_model=PaginatedVehicles)
def list_vehicles(
    status: Optional[VehicleStatus] = Query(None),
    type: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None, description="Field to sort by: registration_number, name_model, type, status, odometer, acquisition_cost, created_at"),
    sort_order: Optional[str] = Query("desc", description="asc or desc"),
    skip: int = Query(0, ge=0, description="Number of records to skip (pagination offset)"),
    limit: int = Query(20, ge=1, le=200, description="Max records to return per page"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """List vehicles with optional filters, sorting and pagination."""
    query = db.query(Vehicle)

    if status:
        query = query.filter(Vehicle.status == status)
    if type:
        query = query.filter(Vehicle.type.ilike(f"%{type}%"))
    if region:
        query = query.filter(Vehicle.region.ilike(f"%{region}%"))
    if search:
        query = query.filter(
            (Vehicle.registration_number.ilike(f"%{search}%"))
            | (Vehicle.name_model.ilike(f"%{search}%"))
        )

    # Sorting
    sort_field_map = {
        "registration_number": Vehicle.registration_number,
        "name_model": Vehicle.name_model,
        "type": Vehicle.type,
        "status": Vehicle.status,
        "odometer": Vehicle.odometer,
        "acquisition_cost": Vehicle.acquisition_cost,
        "created_at": Vehicle.created_at,
    }
    sort_col = sort_field_map.get(sort_by, Vehicle.created_at)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return PaginatedVehicles(items=items, total=total, skip=skip, limit=limit)


@router.get("/available/pool", response_model=list[VehicleResponse])
def available_vehicle_pool(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Return only vehicles with status=Available. Dropdown source for trip creation."""
    return (
        db.query(Vehicle)
        .filter(Vehicle.status == VehicleStatus.Available)
        .order_by(Vehicle.name_model)
        .all()
    )


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Get a single vehicle by ID."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    return vehicle


@router.put(
    "/{vehicle_id}",
    response_model=VehicleResponse,
    dependencies=[Depends(require_roles("fleet_manager"))],
)
def update_vehicle(
    vehicle_id: int,
    body: VehicleUpdate,
    db: Session = Depends(get_db),
):
    """Partial update — only supplied fields change."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

    update_data = body.model_dump(exclude_unset=True)

    # If registration_number is being changed, check uniqueness
    if "registration_number" in update_data:
        existing = (
            db.query(Vehicle)
            .filter(
                Vehicle.registration_number == update_data["registration_number"],
                Vehicle.id != vehicle_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration number '{update_data['registration_number']}' is already in use.",
            )

    # Validate status if provided
    if "status" in update_data and update_data["status"] is not None:
        try:
            update_data["status"] = VehicleStatus(update_data["status"])
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {[s.value for s in VehicleStatus]}",
            )

    for field, value in update_data.items():
        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_200_OK)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles("fleet_manager")),
):
    """Delete a vehicle. Blocked if it has any trip history — suggest Retired instead."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

    # Block delete if vehicle has trips
    if vehicle.trips:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete vehicle '{vehicle.registration_number}' — it has {len(vehicle.trips)} trip(s). "
                   f"Set status to 'Retired' instead.",
        )

    db.delete(vehicle)
    db.commit()
    return {"detail": f"Vehicle '{vehicle.registration_number}' deleted successfully."}
