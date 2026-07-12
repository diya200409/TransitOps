"""
TransitOps — Fuel Logs & Expenses router.
Source of truth for cost aggregation in Analytics.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
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
    # Validate vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == body.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

    # Validate trip exists if provided
    if body.trip_id is not None:
        trip = db.query(Trip).filter(Trip.id == body.trip_id).first()
        if not trip:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")

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


@router.get("/fuel-logs", response_model=list[FuelLogResponse])
def list_fuel_logs(
    vehicle_id: Optional[int] = Query(None),
    trip_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """List fuel logs with optional filters."""
    query = db.query(FuelLog)

    if vehicle_id:
        query = query.filter(FuelLog.vehicle_id == vehicle_id)
    if trip_id:
        query = query.filter(FuelLog.trip_id == trip_id)

    return query.order_by(FuelLog.date.desc()).all()


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
    # Validate vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == body.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

    # Validate trip exists if provided
    if body.trip_id is not None:
        trip = db.query(Trip).filter(Trip.id == body.trip_id).first()
        if not trip:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")

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


@router.get("/expenses", response_model=list[ExpenseResponse])
def list_expenses(
    vehicle_id: Optional[int] = Query(None),
    trip_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """List expenses with optional filters."""
    query = db.query(Expense)

    if vehicle_id:
        query = query.filter(Expense.vehicle_id == vehicle_id)
    if trip_id:
        query = query.filter(Expense.trip_id == trip_id)
    if type:
        query = query.filter(Expense.type == ExpenseType(type))

    return query.order_by(Expense.date.desc()).all()
