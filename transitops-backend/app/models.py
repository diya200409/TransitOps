"""
TransitOps — SQLAlchemy ORM models and Python enums.
7 tables: users, vehicles, drivers, trips, maintenance_records, fuel_logs, expenses.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


# ── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    fleet_manager = "fleet_manager"
    driver = "driver"
    safety_officer = "safety_officer"
    financial_analyst = "financial_analyst"


class VehicleStatus(str, enum.Enum):
    Available = "Available"
    On_Trip = "On Trip"
    In_Shop = "In Shop"
    Retired = "Retired"


class DriverStatus(str, enum.Enum):
    Available = "Available"
    On_Trip = "On Trip"
    Off_Duty = "Off Duty"
    Suspended = "Suspended"


class TripStatus(str, enum.Enum):
    Draft = "Draft"
    Dispatched = "Dispatched"
    Completed = "Completed"
    Cancelled = "Cancelled"


class MaintenanceStatus(str, enum.Enum):
    Open = "Open"
    Closed = "Closed"


class ExpenseType(str, enum.Enum):
    Toll = "Toll"
    Maintenance = "Maintenance"
    Other = "Other"


# ── Helpers ──────────────────────────────────────────────────────────────────

def _utcnow():
    return datetime.now(timezone.utc)


# ── Models ───────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)

    # Relationships
    driver = relationship("Driver", back_populates="user_account", foreign_keys=[driver_id])


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    registration_number = Column(String, unique=True, index=True, nullable=False)
    name_model = Column(String, nullable=False)
    type = Column(String, nullable=False)
    max_load_capacity = Column(Float, nullable=False)
    odometer = Column(Float, default=0)
    acquisition_cost = Column(Float, nullable=False)
    status = Column(Enum(VehicleStatus), default=VehicleStatus.Available, nullable=False)
    region = Column(String, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    # Relationships
    trips = relationship("Trip", back_populates="vehicle")
    maintenance_records = relationship("MaintenanceRecord", back_populates="vehicle")
    fuel_logs = relationship("FuelLog", back_populates="vehicle")
    expenses = relationship("Expense", back_populates="vehicle")


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, index=True, nullable=False)
    license_category = Column(String, nullable=False)
    license_expiry_date = Column(DateTime, nullable=False)
    contact_number = Column(String, nullable=False)
    safety_score = Column(Float, default=100.0)
    status = Column(Enum(DriverStatus), default=DriverStatus.Available, nullable=False)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    # Relationships
    trips = relationship("Trip", back_populates="driver")
    user_account = relationship("User", back_populates="driver", uselist=False)


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    cargo_weight = Column(Float, nullable=False)
    planned_distance = Column(Float, nullable=False)
    actual_distance = Column(Float, nullable=True)
    fuel_consumed = Column(Float, nullable=True)
    revenue = Column(Float, default=0.0, nullable=False)
    status = Column(Enum(TripStatus), default=TripStatus.Draft, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    dispatched_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
    fuel_logs = relationship("FuelLog", back_populates="trip")
    expenses = relationship("Expense", back_populates="trip")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    description = Column(Text, nullable=False)
    cost = Column(Float, default=0.0)
    status = Column(Enum(MaintenanceStatus), default=MaintenanceStatus.Open, nullable=False)
    created_at = Column(DateTime, default=_utcnow)
    closed_at = Column(DateTime, nullable=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="maintenance_records")


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    liters = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    date = Column(DateTime, default=_utcnow)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="fuel_logs")
    trip = relationship("Trip", back_populates="fuel_logs")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    type = Column(Enum(ExpenseType), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(DateTime, default=_utcnow)
    description = Column(String, nullable=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="expenses")
    trip = relationship("Trip", back_populates="expenses")
