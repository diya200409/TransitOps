"""
TransitOps E2E Acceptance Test — matches Backend Spec Section 13.
Tests the full mandatory PS flow end-to-end.
"""
import requests
import sys

BASE = "http://127.0.0.1:8000"
PASS = True

def check(label, condition, detail=""):
    global PASS
    if condition:
        print(f"  [PASS] {label}")
    else:
        print(f"  [FAIL] {label} -- {detail}")
        PASS = False

def main():
    global PASS

    # --- Login as fleet manager ---
    print("\n== 1. Login ==")
    r = requests.post(f"{BASE}/auth/login", json={"email": "fleetmanager@transitops.com", "password": "password123"})
    check("Fleet manager login", r.status_code == 200, r.text)
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # --- Login as driver (for RBAC test later) ---
    r2 = requests.post(f"{BASE}/auth/login", json={"email": "driver@transitops.com", "password": "password123"})
    driver_token = r2.json()["access_token"]
    driver_headers = {"Authorization": f"Bearer {driver_token}"}

    # --- Step 1: Register vehicle Van-05 (500kg) ---
    print("\n== 2. Register Vehicle Van-05 ==")
    r = requests.post(f"{BASE}/vehicles", json={
        "registration_number": "VAN-05",
        "name_model": "Transit Van 05",
        "type": "Van",
        "max_load_capacity": 500,
        "odometer": 1000,
        "acquisition_cost": 750000,
        "region": "North"
    }, headers=headers)
    check("Create Van-05", r.status_code == 201, r.text)
    vehicle_id = r.json()["id"]
    check("Vehicle status = Available", r.json()["status"] == "Available")

    # --- Step 2: Register driver Alex ---
    print("\n== 3. Register Driver Alex ==")
    r = requests.post(f"{BASE}/drivers", json={
        "name": "Alex",
        "license_number": "DL-TEST-ALEX",
        "license_category": "HMV",
        "license_expiry_date": "2027-12-31T00:00:00Z",
        "contact_number": "+91-9999999999"
    }, headers=headers)
    check("Create driver Alex", r.status_code == 201, r.text)
    driver_id = r.json()["id"]

    # --- Step 3: Create trip (450kg < 500kg capacity) ---
    print("\n== 4. Create Trip (valid cargo) ==")
    r = requests.post(f"{BASE}/trips", json={
        "source": "Mumbai",
        "destination": "Pune",
        "vehicle_id": vehicle_id,
        "driver_id": driver_id,
        "cargo_weight": 450,
        "planned_distance": 150,
        "revenue": 15000
    }, headers=headers)
    check("Create trip 450kg", r.status_code == 201, r.text)
    trip_id = r.json()["id"]
    check("Trip status = Draft", r.json()["status"] == "Draft")

    # --- Overweight trip should be rejected ---
    print("\n== 5. Reject Overweight Trip ==")
    r = requests.post(f"{BASE}/trips", json={
        "source": "Mumbai",
        "destination": "Pune",
        "vehicle_id": vehicle_id,
        "driver_id": driver_id,
        "cargo_weight": 600,
        "planned_distance": 150,
        "revenue": 15000
    }, headers=headers)
    check("Reject 600kg trip", r.status_code == 400, r.text)

    # --- Step 4: Dispatch ---
    print("\n== 6. Dispatch Trip ==")
    r = requests.post(f"{BASE}/trips/{trip_id}/dispatch", headers=headers)
    check("Dispatch trip", r.status_code == 200, r.text)
    check("Trip status = Dispatched", r.json()["status"] == "Dispatched")

    # Check vehicle status
    rv = requests.get(f"{BASE}/vehicles/{vehicle_id}", headers=headers)
    check("Vehicle -> On Trip", rv.json()["status"] == "On Trip")

    # Check driver status
    rd = requests.get(f"{BASE}/drivers/{driver_id}", headers=headers)
    check("Driver -> On Trip", rd.json()["status"] == "On Trip")

    # --- Duplicate dispatch should fail ---
    print("\n== 7. Reject Duplicate Dispatch ==")
    r = requests.post(f"{BASE}/trips", json={
        "source": "Delhi",
        "destination": "Agra",
        "vehicle_id": vehicle_id,
        "driver_id": driver_id,
        "cargo_weight": 100,
        "planned_distance": 200,
        "revenue": 10000
    }, headers=headers)
    check("Reject trip on busy vehicle/driver", r.status_code == 400, r.text)

    # --- Step 5: Complete trip ---
    print("\n== 8. Complete Trip ==")
    r = requests.post(f"{BASE}/trips/{trip_id}/complete", json={
        "final_odometer": 1150,
        "fuel_consumed": 25,
        "revenue": 15000
    }, headers=headers)
    check("Complete trip", r.status_code == 200, r.text)
    check("Trip status = Completed", r.json()["status"] == "Completed")
    check("actual_distance = 150", r.json()["actual_distance"] == 150, f"got {r.json().get('actual_distance')}")

    rv = requests.get(f"{BASE}/vehicles/{vehicle_id}", headers=headers)
    check("Vehicle -> Available", rv.json()["status"] == "Available")
    check("Vehicle odometer updated to 1150", rv.json()["odometer"] == 1150)

    rd = requests.get(f"{BASE}/drivers/{driver_id}", headers=headers)
    check("Driver -> Available", rd.json()["status"] == "Available")

    # --- Step 6: Maintenance ---
    print("\n== 9. Maintenance -> In Shop ==")
    r = requests.post(f"{BASE}/maintenance", json={
        "vehicle_id": vehicle_id,
        "description": "Oil change and brake inspection",
        "cost": 5000
    }, headers=headers)
    check("Create maintenance", r.status_code == 201, r.text)
    maint_id = r.json()["id"]

    rv = requests.get(f"{BASE}/vehicles/{vehicle_id}", headers=headers)
    check("Vehicle -> In Shop", rv.json()["status"] == "In Shop")

    # Vehicle should NOT be in available pool
    rp = requests.get(f"{BASE}/vehicles/available/pool", headers=headers)
    pool_ids = [v["id"] for v in rp.json()]
    check("Vehicle not in available pool", vehicle_id not in pool_ids)

    # --- Step 7: Close maintenance ---
    print("\n== 10. Close Maintenance -> Available ==")
    r = requests.post(f"{BASE}/maintenance/{maint_id}/close", json={"final_cost": 5500}, headers=headers)
    check("Close maintenance", r.status_code == 200, r.text)

    rv = requests.get(f"{BASE}/vehicles/{vehicle_id}", headers=headers)
    check("Vehicle -> Available", rv.json()["status"] == "Available")

    # --- Step 8: Fuel + Analytics ---
    print("\n== 11. Fuel Log + Analytics ==")
    r = requests.post(f"{BASE}/fuel-logs", json={
        "vehicle_id": vehicle_id,
        "trip_id": trip_id,
        "liters": 25,
        "cost": 2500
    }, headers=headers)
    check("Create fuel log", r.status_code == 201, r.text)

    r = requests.get(f"{BASE}/analytics/vehicles/{vehicle_id}", headers=headers)
    check("Analytics returned", r.status_code == 200, r.text)
    a = r.json()
    check("total_distance = 150", a["total_distance"] == 150, f"got {a['total_distance']}")
    check("total_fuel_liters = 25", a["total_fuel_liters"] == 25, f"got {a['total_fuel_liters']}")
    check("total_fuel_cost = 2500", a["total_fuel_cost"] == 2500, f"got {a['total_fuel_cost']}")
    check("fuel_efficiency = 6.0", a["fuel_efficiency"] == 6.0, f"got {a['fuel_efficiency']}")
    check("total_maintenance_cost = 5500", a["total_maintenance_cost"] == 5500, f"got {a['total_maintenance_cost']}")
    check("total_operational_cost = 8000", a["total_operational_cost"] == 8000, f"got {a['total_operational_cost']}")
    check("revenue = 15000", a["revenue"] == 15000, f"got {a['revenue']}")
    expected_roi = round((15000 - 8000) / 750000, 4)
    check(f"roi = {expected_roi}", a["roi"] == expected_roi, f"got {a['roi']}")

    # --- Step 9: RBAC ---
    print("\n== 12. RBAC Tests ==")
    r = requests.post(f"{BASE}/vehicles", json={
        "registration_number": "HACK",
        "name_model": "Hack",
        "type": "Van",
        "max_load_capacity": 100,
        "odometer": 0,
        "acquisition_cost": 100
    }, headers=driver_headers)
    check("Driver cannot POST /vehicles (403)", r.status_code == 403, f"got {r.status_code}")

    r = requests.get(f"{BASE}/vehicles")
    check("Unauthenticated GET /vehicles (401/403)", r.status_code in (401, 403), f"got {r.status_code}")

    # --- Dashboard KPIs ---
    print("\n== 13. Dashboard KPIs ==")
    r = requests.get(f"{BASE}/analytics/dashboard", headers=headers)
    check("Dashboard returns", r.status_code == 200, r.text)
    d = r.json()
    check("active_vehicles > 0", d["active_vehicles"] > 0)
    check("fleet_utilization_percent is a number", isinstance(d["fleet_utilization_percent"], (int, float)))

    # --- CSV Export ---
    print("\n== 14. CSV Export ==")
    r = requests.get(f"{BASE}/analytics/vehicles/export/csv", headers=headers)
    check("CSV export 200", r.status_code == 200)
    check("CSV content-type", "text/csv" in r.headers.get("content-type", ""))

    # --- Summary ---
    print("\n" + "="*50)
    if PASS:
        print("ALL TESTS PASSED")
    else:
        print("SOME TESTS FAILED")
    print("="*50)
    sys.exit(0 if PASS else 1)

if __name__ == "__main__":
    main()
