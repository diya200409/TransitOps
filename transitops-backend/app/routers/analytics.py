"""
TransitOps — Analytics & Reports router.
Dashboard KPIs, per-vehicle rollup, and CSV export.
"""

import csv
import io
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import (
    Driver,
    DriverStatus,
    FuelLog,
    MaintenanceRecord,
    Trip,
    TripStatus,
    User,
    Vehicle,
    VehicleStatus,
)
from ..schemas import DashboardKPIs, VehicleAnalytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ── Dashboard KPIs ───────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardKPIs)
def dashboard_kpis(
    vehicle_type: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Dashboard KPI cards.
    Optional filters: vehicle_type, region (apply to vehicle-related KPIs).
    """
    # Base vehicle query with optional filters
    vq = db.query(Vehicle)
    if vehicle_type:
        vq = vq.filter(Vehicle.type.ilike(f"%{vehicle_type}%"))
    if region:
        vq = vq.filter(Vehicle.region.ilike(f"%{region}%"))

    # Non-retired vehicles (base for fleet metrics)
    non_retired = vq.filter(Vehicle.status != VehicleStatus.Retired)
    non_retired_count = non_retired.count()

    active_vehicles = non_retired_count
    available_vehicles = vq.filter(Vehicle.status == VehicleStatus.Available).count()
    vehicles_in_maintenance = vq.filter(Vehicle.status == VehicleStatus.In_Shop).count()
    on_trip_vehicles = vq.filter(Vehicle.status == VehicleStatus.On_Trip).count()

    # Trip KPIs (not filtered by vehicle type/region — these are global)
    active_trips = db.query(Trip).filter(Trip.status == TripStatus.Dispatched).count()
    pending_trips = db.query(Trip).filter(Trip.status == TripStatus.Draft).count()

    # Drivers on duty: Available + On Trip
    drivers_on_duty = (
        db.query(Driver)
        .filter(Driver.status.in_([DriverStatus.Available, DriverStatus.On_Trip]))
        .count()
    )

    # Fleet utilization: On Trip / non-Retired × 100
    if non_retired_count > 0:
        fleet_utilization = round((on_trip_vehicles / non_retired_count) * 100, 2)
    else:
        fleet_utilization = 0.0

    return DashboardKPIs(
        active_vehicles=active_vehicles,
        available_vehicles=available_vehicles,
        vehicles_in_maintenance=vehicles_in_maintenance,
        active_trips=active_trips,
        pending_trips=pending_trips,
        drivers_on_duty=drivers_on_duty,
        fleet_utilization_percent=fleet_utilization,
    )


# ── Per-Vehicle Analytics Computation ────────────────────────────────────────

def _compute_vehicle_analytics(vehicle: Vehicle, db: Session) -> VehicleAnalytics:
    """Compute analytics rollup for a single vehicle."""

    # Total distance from completed trips
    total_distance = (
        db.query(func.coalesce(func.sum(Trip.actual_distance), 0.0))
        .filter(Trip.vehicle_id == vehicle.id, Trip.status == TripStatus.Completed)
        .scalar()
    )

    # Fuel from fuel_logs table (source of truth — not trips.fuel_consumed)
    fuel_result = (
        db.query(
            func.coalesce(func.sum(FuelLog.liters), 0.0),
            func.coalesce(func.sum(FuelLog.cost), 0.0),
        )
        .filter(FuelLog.vehicle_id == vehicle.id)
        .first()
    )
    total_fuel_liters = fuel_result[0]
    total_fuel_cost = fuel_result[1]

    # Fuel efficiency
    fuel_efficiency = None
    if total_fuel_liters > 0:
        fuel_efficiency = round(total_distance / total_fuel_liters, 2)

    # Total maintenance cost (all records, open or closed)
    total_maintenance_cost = (
        db.query(func.coalesce(func.sum(MaintenanceRecord.cost), 0.0))
        .filter(MaintenanceRecord.vehicle_id == vehicle.id)
        .scalar()
    )

    # Total operational cost
    total_operational_cost = total_fuel_cost + total_maintenance_cost

    # Revenue from completed trips
    revenue = (
        db.query(func.coalesce(func.sum(Trip.revenue), 0.0))
        .filter(Trip.vehicle_id == vehicle.id, Trip.status == TripStatus.Completed)
        .scalar()
    )

    # ROI = (revenue - ops_cost) / acquisition_cost
    roi = None
    if vehicle.acquisition_cost > 0:
        roi = round((revenue - total_operational_cost) / vehicle.acquisition_cost, 4)

    return VehicleAnalytics(
        vehicle_id=vehicle.id,
        registration_number=vehicle.registration_number,
        name_model=vehicle.name_model,
        type=vehicle.type,
        status=vehicle.status.value,
        acquisition_cost=vehicle.acquisition_cost,
        total_distance=round(total_distance, 2),
        total_fuel_liters=round(total_fuel_liters, 2),
        total_fuel_cost=round(total_fuel_cost, 2),
        fuel_efficiency=fuel_efficiency,
        total_maintenance_cost=round(total_maintenance_cost, 2),
        total_operational_cost=round(total_operational_cost, 2),
        revenue=round(revenue, 2),
        roi=roi,
    )


# ── Per-Vehicle Rollup Endpoints ─────────────────────────────────────────────

@router.get("/vehicles", response_model=list[VehicleAnalytics])
def vehicle_analytics_list(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Per-vehicle analytics rollup for every vehicle."""
    vehicles = db.query(Vehicle).order_by(Vehicle.id).all()
    return [_compute_vehicle_analytics(v, db) for v in vehicles]


@router.get("/vehicles/export/csv")
def vehicle_analytics_csv(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Export per-vehicle analytics as a downloadable CSV."""
    vehicles = db.query(Vehicle).order_by(Vehicle.id).all()
    analytics = [_compute_vehicle_analytics(v, db) for v in vehicles]

    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    writer.writerow([
        "Vehicle ID",
        "Registration Number",
        "Name/Model",
        "Type",
        "Status",
        "Acquisition Cost",
        "Total Distance (km)",
        "Total Fuel (liters)",
        "Total Fuel Cost",
        "Fuel Efficiency (km/L)",
        "Total Maintenance Cost",
        "Total Operational Cost",
        "Revenue",
        "ROI",
    ])

    # Data rows
    for a in analytics:
        writer.writerow([
            a.vehicle_id,
            a.registration_number,
            a.name_model,
            a.type,
            a.status,
            a.acquisition_cost,
            a.total_distance,
            a.total_fuel_liters,
            a.total_fuel_cost,
            a.fuel_efficiency if a.fuel_efficiency is not None else "",
            a.total_maintenance_cost,
            a.total_operational_cost,
            a.revenue,
            a.roi if a.roi is not None else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vehicle_analytics.csv"},
    )


@router.get("/vehicles/{vehicle_id}", response_model=VehicleAnalytics)
def vehicle_analytics_detail(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Per-vehicle analytics for a single vehicle."""
    from fastapi import HTTPException, status as http_status

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found.",
        )
    return _compute_vehicle_analytics(vehicle, db)
