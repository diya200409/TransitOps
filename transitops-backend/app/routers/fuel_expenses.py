"""
TransitOps — Fuel Logs & Expenses router.
Source of truth for cost aggregation in Analytics.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import Expense, ExpenseType, FuelLog, Trip, User, Vehicle
from ..schemas import (
    ExpenseCreate,
    ExpenseResponse,
    FuelLogCreate,
    FuelLogResponse,
)

router = APIRouter(tags=["Fuel & Expenses"])


class PaginatedFuelLogs(BaseModel):
    items: List[FuelLogResponse]
    total: int
    skip: int
    limit: int


class PaginatedExpenses(BaseModel):
    items: List[ExpenseResponse]
    total: int
    skip: int
    limit: int


def _validate_vehicle_and_trip(
    vehicle_id: int,
    trip_id: Optional[int],
    db: Session,
) -> None:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

    if trip_id is None:
        return

    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    if trip.vehicle_id != vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trip does not belong to the supplied vehicle.",
        )


# ── Fuel Logs ────────────────────────────────────────────────────────────────

@router.post(
    "/fuel-logs",
    response_model=FuelLogResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_fuel_log(
    body: FuelLogCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Create a fuel log entry. Validates referenced vehicle_id and trip_id exist."""
    _validate_vehicle_and_trip(body.vehicle_id, body.trip_id, db)

    fuel_log = FuelLog(
        vehicle_id=body.vehicle_id,
        trip_id=body.trip_id,
        liters=body.liters,
        cost=body.cost,
    )
    db.add(fuel_log)
    db.commit()
    db.refresh(fuel_log)
    return fuel_log


@router.get("/fuel-logs", response_model=PaginatedFuelLogs)
def list_fuel_logs(
    vehicle_id: Optional[int] = Query(None),
    trip_id: Optional[int] = Query(None),
    sort_by: Optional[str] = Query(None, description="Field to sort by: liters, cost, date"),
    sort_order: Optional[str] = Query("desc", description="asc or desc"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=200, description="Max records per page"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """List fuel logs with optional filters, sorting and pagination."""
    query = db.query(FuelLog)

    if vehicle_id is not None:
        query = query.filter(FuelLog.vehicle_id == vehicle_id)
    if trip_id is not None:
        query = query.filter(FuelLog.trip_id == trip_id)

    # Sorting
    sort_field_map = {
        "liters": FuelLog.liters,
        "cost": FuelLog.cost,
        "date": FuelLog.date,
    }
    sort_col = sort_field_map.get(sort_by, FuelLog.date)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return PaginatedFuelLogs(items=items, total=total, skip=skip, limit=limit)


# ── Expenses ─────────────────────────────────────────────────────────────────

@router.post(
    "/expenses",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_expense(
    body: ExpenseCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Create an expense entry. Validates referenced vehicle_id and trip_id exist."""
    _validate_vehicle_and_trip(body.vehicle_id, body.trip_id, db)

    # Validate expense type
    try:
        expense_type = ExpenseType(body.type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid expense type '{body.type}'. Must be one of: {[e.value for e in ExpenseType]}",
        )

    expense = Expense(
        vehicle_id=body.vehicle_id,
        trip_id=body.trip_id,
        type=expense_type,
        amount=body.amount,
        description=body.description,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("/expenses", response_model=PaginatedExpenses)
def list_expenses(
    vehicle_id: Optional[int] = Query(None),
    trip_id: Optional[int] = Query(None),
    type: Optional[ExpenseType] = Query(None),
    sort_by: Optional[str] = Query(None, description="Field to sort by: type, amount, date"),
    sort_order: Optional[str] = Query("desc", description="asc or desc"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=200, description="Max records per page"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """List expenses with optional filters, sorting and pagination."""
    query = db.query(Expense)

    if vehicle_id is not None:
        query = query.filter(Expense.vehicle_id == vehicle_id)
    if trip_id is not None:
        query = query.filter(Expense.trip_id == trip_id)
    if type:
        query = query.filter(Expense.type == type)

    # Sorting
    sort_field_map = {
        "type": Expense.type,
        "amount": Expense.amount,
        "date": Expense.date,
    }
    sort_col = sort_field_map.get(sort_by, Expense.date)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return PaginatedExpenses(items=items, total=total, skip=skip, limit=limit)
