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
    vehicle_type: Optional[str] = Query(None, description="Filter vehicle KPIs by type (e.g. Truck, Van)"),
    region: Optional[str] = Query(None, description="Filter vehicle KPIs by region"),
    status: Optional[VehicleStatus] = Query(None, description="Filter vehicle KPIs by status (Available, On Trip, In Shop, Retired)"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Dashboard KPI cards.
    Optional filters: vehicle_type, region, status (apply to vehicle-related KPIs).
    """
    # Base vehicle query with optional filters
    vq = db.query(Vehicle)
    if vehicle_type:
        vq = vq.filter(Vehicle.type.ilike(f"%{vehicle_type}%"))
    if region:
        vq = vq.filter(Vehicle.region.ilike(f"%{region}%"))
    if status:
        vq = vq.filter(Vehicle.status == status)

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
        on_trip_vehicles=on_trip_vehicles,
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
    type: Optional[str] = Query(None, description="Filter by vehicle type (e.g. Truck, Van)"),
    region: Optional[str] = Query(None, description="Filter by region"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Per-vehicle analytics rollup. Optionally filter by type and/or region."""
    vq = db.query(Vehicle)
    if type:
        vq = vq.filter(Vehicle.type.ilike(f"%{type}%"))
    if region:
        vq = vq.filter(Vehicle.region.ilike(f"%{region}%"))
    vehicles = vq.order_by(Vehicle.id).all()
    return [_compute_vehicle_analytics(v, db) for v in vehicles]


@router.get("/vehicles/export/csv")
def vehicle_analytics_csv(
    type: Optional[str] = Query(None, description="Filter by vehicle type"),
    region: Optional[str] = Query(None, description="Filter by region"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Export per-vehicle analytics as a downloadable CSV. Supports same type/region filters as the list endpoint."""
    vq = db.query(Vehicle)
    if type:
        vq = vq.filter(Vehicle.type.ilike(f"%{type}%"))
    if region:
        vq = vq.filter(Vehicle.region.ilike(f"%{region}%"))
    vehicles = vq.order_by(Vehicle.id).all()
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


@router.get("/vehicles/export/pdf")
def vehicle_analytics_pdf(
    type: Optional[str] = Query(None, description="Filter by vehicle type"),
    region: Optional[str] = Query(None, description="Filter by region"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Export per-vehicle analytics as a downloadable PDF report. Supports same type/region filters."""
    from fpdf import FPDF

    vq = db.query(Vehicle)
    if type:
        vq = vq.filter(Vehicle.type.ilike(f"%{type}%"))
    if region:
        vq = vq.filter(Vehicle.region.ilike(f"%{region}%"))
    vehicles = vq.order_by(Vehicle.id).all()
    analytics = [_compute_vehicle_analytics(v, db) for v in vehicles]

    # Build PDF
    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Title
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 12, "TransitOps - Vehicle Analytics Report", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    from datetime import datetime as dt
    pdf.cell(0, 6, f"Generated: {dt.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # Table header
    headers = [
        ("ID", 10), ("Reg. Number", 28), ("Model", 28), ("Type", 18),
        ("Status", 18), ("Acq. Cost", 22), ("Distance", 22), ("Fuel (L)", 20),
        ("Fuel Cost", 22), ("Eff. (km/L)", 22), ("Maint. Cost", 22),
        ("Ops Cost", 22), ("Revenue", 22), ("ROI", 16),
    ]

    pdf.set_font("Helvetica", "B", 7)
    pdf.set_fill_color(41, 128, 185)  # Blue header
    pdf.set_text_color(255, 255, 255)
    for header, width in headers:
        pdf.cell(width, 8, header, border=1, fill=True, align="C")
    pdf.ln()

    # Table rows
    pdf.set_font("Helvetica", "", 7)
    pdf.set_text_color(0, 0, 0)
    fill = False
    for a in analytics:
        if fill:
            pdf.set_fill_color(235, 245, 251)
        else:
            pdf.set_fill_color(255, 255, 255)

        row = [
            str(a.vehicle_id),
            a.registration_number,
            a.name_model[:18],
            a.type[:12],
            a.status,
            f"{a.acquisition_cost:,.0f}",
            f"{a.total_distance:,.1f}",
            f"{a.total_fuel_liters:,.1f}",
            f"{a.total_fuel_cost:,.0f}",
            f"{a.fuel_efficiency:.2f}" if a.fuel_efficiency is not None else "N/A",
            f"{a.total_maintenance_cost:,.0f}",
            f"{a.total_operational_cost:,.0f}",
            f"{a.revenue:,.0f}",
            f"{a.roi:.3f}" if a.roi is not None else "N/A",
        ]

        for i, (_, width) in enumerate(headers):
            pdf.cell(width, 7, row[i], border=1, fill=True, align="C")
        pdf.ln()
        fill = not fill

    # Summary
    pdf.ln(6)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(0, 7, f"Total Vehicles: {len(analytics)}", new_x="LMARGIN", new_y="NEXT")
    if analytics:
        total_revenue = sum(a.revenue for a in analytics)
        total_ops_cost = sum(a.total_operational_cost for a in analytics)
        pdf.cell(0, 7, f"Total Revenue: {total_revenue:,.2f}  |  Total Operational Cost: {total_ops_cost:,.2f}", new_x="LMARGIN", new_y="NEXT")

    # Output to bytes
    pdf_bytes = pdf.output()

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=vehicle_analytics_report.pdf"},
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
