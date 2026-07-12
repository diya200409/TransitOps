# TransitOps API Reference

**Base URL:** `http://localhost:8000`

All endpoints (except health check, signup, and login) require `Authorization: Bearer <token>` header.

---

## Authentication

### POST `/auth/signup`
Create a new user.
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "role": "fleet_manager"  // fleet_manager | driver | safety_officer | financial_analyst
}
```
**Response:** `201` — User object

### POST `/auth/login`
```json
{
  "email": "fleetmanager@transitops.com",
  "password": "password123"
}
```
**Response:** `{ "access_token": "...", "token_type": "bearer", "user": {...} }`

### GET `/auth/me`
**Auth:** Bearer token required
**Response:** Current user object

---

## Vehicles

### POST `/vehicles`
**Auth:** `fleet_manager` only
```json
{
  "registration_number": "VAN-05",
  "name_model": "Transit Van",
  "type": "Van",
  "max_load_capacity": 500,
  "odometer": 0,
  "acquisition_cost": 750000,
  "region": "North"
}
```

### GET `/vehicles?status=&type=&region=&search=&sort_by=&sort_order=`
**Auth:** Any authenticated user.
- `search` — matches registration number or name/model (case-insensitive)
- `sort_by` — `registration_number | name_model | type | status | odometer | acquisition_cost | created_at`
- `sort_order` — `asc | desc` (default: `desc`)

### GET `/vehicles/available/pool`
**Auth:** Any. Returns only `Available` vehicles — dropdown source for trip creation.

### GET `/vehicles/{id}`

### PUT `/vehicles/{id}`
**Auth:** `fleet_manager` only. Partial update — send only fields to change.

### DELETE `/vehicles/{id}`
**Auth:** `fleet_manager` only. Blocked if vehicle has trip history (suggest `Retired` instead).

---

## Drivers

### POST `/drivers`
**Auth:** `fleet_manager` or `safety_officer`
```json
{
  "name": "Alex",
  "license_number": "DL-2024-9999",
  "license_category": "HMV",
  "license_expiry_date": "2027-07-12T00:00:00Z",
  "contact_number": "+91-9876543210"
}
```

### GET `/drivers?status=&search=&sort_by=&sort_order=`
- `sort_by` — `name | status | safety_score | license_expiry_date | created_at`
- `sort_order` — `asc | desc` (default: `asc`)

### GET `/drivers/available/pool`
Returns drivers with `status=Available` AND valid license (expiry > now).
This is the trip-creation dropdown source.

### GET `/drivers/expiring-licenses?days=30`
**Auth:** Any authenticated user (primary audience: `safety_officer`)
Returns drivers whose license expires within `days` days (default 30), including already-expired ones.
Results sorted by expiry date ascending (soonest first).

**Response includes extra field:**
```json
{
  "id": 1, "name": "Rajesh Kumar", ...,
  "days_until_expiry": 12   // negative = already expired
}
```

### GET `/drivers/{id}`
### PUT `/drivers/{id}`
**Auth:** `fleet_manager` or `safety_officer`

### DELETE `/drivers/{id}`
Blocked if driver has trip history (suggest `Off Duty` or `Suspended` instead).

---

## Trips

### POST `/trips`
**Auth:** `fleet_manager` or `driver`
```json
{
  "source": "Mumbai",
  "destination": "Pune",
  "vehicle_id": 1,
  "driver_id": 1,
  "cargo_weight": 450,
  "planned_distance": 150,
  "revenue": 15000
}
```
Creates trip in `Draft` status. Validates vehicle/driver availability and cargo capacity.

### POST `/trips/{id}/dispatch`
**Auth:** `fleet_manager` or `driver`
Re-validates everything, then sets vehicle & driver to `On Trip`, stamps `dispatched_at`.

### POST `/trips/{id}/complete`
**Auth:** `fleet_manager` or `driver`
```json
{
  "final_odometer": 12800,
  "fuel_consumed": 25,
  "revenue": 15000
}
```
Computes `actual_distance` from odometer delta, updates vehicle odometer, restores statuses to `Available`.

### POST `/trips/{id}/cancel`
**Auth:** `fleet_manager` or `driver`
From `Draft`: just cancels. From `Dispatched`: also restores vehicle/driver to `Available`.

### GET `/trips?status=&vehicle_id=&driver_id=`
### GET `/trips/{id}`

---

## Maintenance

### POST `/maintenance`
**Auth:** `fleet_manager` only
```json
{
  "vehicle_id": 1,
  "description": "Oil change and brake inspection",
  "cost": 5000
}
```
Auto-flips vehicle to `In Shop` (unless Retired). Rejects if vehicle is `On Trip`.

### POST `/maintenance/{id}/close`
**Auth:** `fleet_manager` only
```json
{
  "final_cost": 5500
}
```
Auto-restores vehicle to `Available` — only if not Retired AND no other open maintenance record on the same vehicle.

### GET `/maintenance?vehicle_id=&status=`
### GET `/maintenance/{id}`

---

## Fuel Logs

### POST `/fuel-logs`
```json
{
  "vehicle_id": 1,
  "trip_id": 1,
  "liters": 25,
  "cost": 2500
}
```
`trip_id` is optional. Validates vehicle and trip exist.

### GET `/fuel-logs?vehicle_id=&trip_id=`

---

## Expenses

### POST `/expenses`
```json
{
  "vehicle_id": 1,
  "trip_id": 1,
  "type": "Toll",
  "amount": 350,
  "description": "Highway toll"
}
```
Types: `Toll | Maintenance | Other`

### GET `/expenses?vehicle_id=&trip_id=&type=`

---

## Analytics

### GET `/analytics/dashboard?vehicle_type=&region=&status=`
Returns KPI cards. All three query params filter vehicle-related KPIs.
```json
{
  "active_vehicles": 5,
  "available_vehicles": 3,
  "vehicles_in_maintenance": 1,
  "on_trip_vehicles": 2,
  "active_trips": 2,
  "pending_trips": 1,
  "drivers_on_duty": 4,
  "fleet_utilization_percent": 40.0
}
```

### GET `/analytics/vehicles?type=&region=`
Per-vehicle rollup with distance, fuel efficiency, costs, revenue, ROI.
Supports same `type` and `region` filters as the vehicle list.

### GET `/analytics/vehicles/{id}`
Same shape, single vehicle.

### GET `/analytics/vehicles/export/csv?type=&region=`
Downloads CSV file with all vehicle analytics data. Supports same filters as the list endpoint.

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Fleet Manager | fleetmanager@transitops.com | password123 |
| Driver | driver@transitops.com | password123 |
| Safety Officer | safety@transitops.com | password123 |
| Financial Analyst | finance@transitops.com | password123 |

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Business rule violation (validation, duplicate, invalid state transition) |
| 401 | Missing/invalid/expired token |
| 403 | Authenticated but wrong role for this action |
| 404 | Referenced entity not found |

All errors return `{ "detail": "human-readable message" }`
