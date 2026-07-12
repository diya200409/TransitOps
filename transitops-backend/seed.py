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
from app.models import Driver, DriverStatus, User, UserRole, Vehicle, VehicleStatus
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

        db.commit()
        print("\nSeed completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"\nSeed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding TransitOps database...\n")
    seed()
