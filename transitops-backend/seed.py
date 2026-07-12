"""
TransitOps — Seed script.
Creates demo users (one per role), sample vehicles, and a sample driver.
Idempotent — safe to re-run.

Usage:
    cd transitops-backend
    python seed.py
"""

import sys
from datetime import datetime, timedelta, timezone

# Ensure the app package is importable
sys.path.insert(0, ".")

from app.database import SessionLocal, Base, engine
from app.models import (
    Driver,
    DriverStatus,
    Expense,
    ExpenseType,
    FuelLog,
    MaintenanceRecord,
    MaintenanceStatus,
    Trip,
    TripStatus,
    User,
    UserRole,
    Vehicle,
    VehicleStatus,
)
from app.security import hash_password

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        # ── Demo Users ───────────────────────────────────────────────────
        demo_users = [
            {
                "email": "fleetmanager@transitops.com",
                "full_name": "Fleet Manager",
                "role": UserRole.fleet_manager,
            },
            {
                "email": "driver@transitops.com",
                "full_name": "Demo Driver",
                "role": UserRole.driver,
            },
            {
                "email": "safety@transitops.com",
                "full_name": "Safety Officer",
                "role": UserRole.safety_officer,
            },
            {
                "email": "finance@transitops.com",
                "full_name": "Financial Analyst",
                "role": UserRole.financial_analyst,
            },
        ]

        hashed_pw = hash_password("password123")

        for user_data in demo_users:
            existing = db.query(User).filter(User.email == user_data["email"]).first()
            if not existing:
                user = User(
                    email=user_data["email"],
                    hashed_password=hashed_pw,
                    full_name=user_data["full_name"],
                    role=user_data["role"],
                )
                db.add(user)
                print(f"  + Created user: {user_data['email']}")
            else:
                print(f"  - User exists: {user_data['email']}")

        # ── Sample Vehicles ──────────────────────────────────────────────
        demo_vehicles = [
            {
                "registration_number": "TRK-001",
                "name_model": "Tata 407 Truck",
                "type": "Truck",
                "max_load_capacity": 3500.0,
                "odometer": 12500.0,
                "acquisition_cost": 1200000.0,
                "status": VehicleStatus.Available,
                "region": "North",
            },
            {
                "registration_number": "VAN-002",
                "name_model": "Mahindra Supro Van",
                "type": "Van",
                "max_load_capacity": 800.0,
                "odometer": 8200.0,
                "acquisition_cost": 650000.0,
                "status": VehicleStatus.Available,
                "region": "South",
            },
        ]

        for v_data in demo_vehicles:
            existing = db.query(Vehicle).filter(
                Vehicle.registration_number == v_data["registration_number"]
            ).first()
            if not existing:
                vehicle = Vehicle(**v_data)
                db.add(vehicle)
                print(f"  + Created vehicle: {v_data['registration_number']}")
            else:
                print(f"  - Vehicle exists: {v_data['registration_number']}")

        # ── Sample Driver ────────────────────────────────────────────────
        demo_drivers = [
            {
                "name": "Rajesh Kumar",
                "license_number": "DL-2024-001234",
                "license_category": "HMV",
                "license_expiry_date": datetime.now(timezone.utc) + timedelta(days=365),
                "contact_number": "+91-9876543210",
                "safety_score": 100.0,
                "status": DriverStatus.Available,
            },
        ]

        for d_data in demo_drivers:
            existing = db.query(Driver).filter(
                Driver.license_number == d_data["license_number"]
            ).first()
            if not existing:
                driver = Driver(**d_data)
                db.add(driver)
                print(f"  + Created driver: {d_data['name']}")
            else:
                print(f"  - Driver exists: {d_data['name']}")

        db.flush()
        demo_driver = db.query(Driver).filter(
            Driver.license_number == "DL-2024-001234"
        ).first()
        driver_user = db.query(User).filter(
            User.email == "driver@transitops.com"
        ).first()
        if demo_driver and driver_user and driver_user.driver_id != demo_driver.id:
            driver_user.driver_id = demo_driver.id
            print(f"  + Linked driver user to profile: {demo_driver.name}")

        # ── Sample Trips ─────────────────────────────────────────────────
        vehicle1 = db.query(Vehicle).filter(Vehicle.registration_number == "TRK-001").first()
        vehicle2 = db.query(Vehicle).filter(Vehicle.registration_number == "VAN-002").first()
        
        if vehicle1 and demo_driver:
            existing_trip = db.query(Trip).filter(Trip.source == "Mumbai", Trip.destination == "Pune").first()
            if not existing_trip:
                trip1 = Trip(
                    source="Mumbai",
                    destination="Pune",
                    vehicle_id=vehicle1.id,
                    driver_id=demo_driver.id,
                    cargo_weight=2500.0,
                    planned_distance=150.0,
                    actual_distance=148.5,
                    fuel_consumed=25.0,
                    revenue=15000.0,
                    status=TripStatus.Completed,
                    dispatched_at=datetime.now(timezone.utc) - timedelta(days=5),
                    completed_at=datetime.now(timezone.utc) - timedelta(days=4),
                )
                db.add(trip1)
                print(f"  + Created trip: Mumbai → Pune")

        # ── Sample Maintenance Records ───────────────────────────────────
        if vehicle1:
            existing_maint = db.query(MaintenanceRecord).filter(
                MaintenanceRecord.vehicle_id == vehicle1.id
            ).first()
            if not existing_maint:
                maint1 = MaintenanceRecord(
                    vehicle_id=vehicle1.id,
                    description="Oil Change and Filter Replacement",
                    cost=3500.0,
                    status=MaintenanceStatus.Closed,
                    closed_at=datetime.now(timezone.utc) - timedelta(days=2),
                )
                db.add(maint1)
                print(f"  + Created maintenance: Oil Change for TRK-001")
                
        if vehicle2:
            existing_maint2 = db.query(MaintenanceRecord).filter(
                MaintenanceRecord.vehicle_id == vehicle2.id,
                MaintenanceRecord.status == MaintenanceStatus.Open
            ).first()
            if not existing_maint2:
                maint2 = MaintenanceRecord(
                    vehicle_id=vehicle2.id,
                    description="Brake Service and Inspection",
                    cost=5200.0,
                    status=MaintenanceStatus.Open,
                )
                db.add(maint2)
                print(f"  + Created maintenance: Brake Service for VAN-002 (Open)")

        # ── Sample Fuel Logs ─────────────────────────────────────────────
        if vehicle1:
            existing_fuel = db.query(FuelLog).filter(
                FuelLog.vehicle_id == vehicle1.id
            ).first()
            if not existing_fuel:
                fuel1 = FuelLog(
                    vehicle_id=vehicle1.id,
                    liters=50.0,
                    cost=5000.0,
                    date=datetime.now(timezone.utc) - timedelta(days=3),
                )
                db.add(fuel1)
                print(f"  + Created fuel log: 50L for TRK-001")
                
        if vehicle2:
            existing_fuel2 = db.query(FuelLog).filter(
                FuelLog.vehicle_id == vehicle2.id
            ).first()
            if not existing_fuel2:
                fuel2 = FuelLog(
                    vehicle_id=vehicle2.id,
                    liters=35.0,
                    cost=3500.0,
                    date=datetime.now(timezone.utc) - timedelta(days=1),
                )
                db.add(fuel2)
                print(f"  + Created fuel log: 35L for VAN-002")

        # ── Sample Expenses ──────────────────────────────────────────────
        if vehicle1:
            existing_exp = db.query(Expense).filter(
                Expense.vehicle_id == vehicle1.id
            ).first()
            if not existing_exp:
                exp1 = Expense(
                    vehicle_id=vehicle1.id,
                    type=ExpenseType.Toll,
                    amount=500.0,
                    description="Highway toll - Mumbai to Pune",
                    date=datetime.now(timezone.utc) - timedelta(days=5),
                )
                db.add(exp1)
                print(f"  + Created expense: Toll for TRK-001")
                
        if vehicle2:
            existing_exp2 = db.query(Expense).filter(
                Expense.vehicle_id == vehicle2.id,
                Expense.type == ExpenseType.Maintenance
            ).first()
            if not existing_exp2:
                exp2 = Expense(
                    vehicle_id=vehicle2.id,
                    type=ExpenseType.Maintenance,
                    amount=2500.0,
                    description="Tyre replacement",
                    date=datetime.now(timezone.utc) - timedelta(days=7),
                )
                db.add(exp2)
                print(f"  + Created expense: Maintenance for VAN-002")

        db.commit()
        print("\n✓ Seed completed successfully with sample data for all modules!")

    except Exception as e:
        db.rollback()
        print(f"\nSeed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding TransitOps database...\n")
    seed()
