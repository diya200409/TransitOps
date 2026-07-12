# TransitOps — Backend Build Spec

Build a REST API backend for **TransitOps**, a Smart Transport Operations Platform (fleet/driver/trip/maintenance/expense management).

> Database schema is defined in a separate file: `TransitOps_Database_Schema.md`. Read that first — this spec assumes those entities exist.

## 1. Tech Stack

- **Framework:** FastAPI (Python)
- **ORM:** SQLAlchemy
- **Database:** SQLite (file-based, `transitops.db`)
- **Auth:** JWT (via `python-jose`), password hashing via `bcrypt` (call `bcrypt` directly, **not** via `passlib` — passlib has a known version-incompatibility bug with recent bcrypt releases that throws `AttributeError: module 'bcrypt' has no attribute '__about__'`)
- **Validation:** Pydantic v2 schemas for every request/response
- **CORS:** enabled wide-open (`allow_origins=["*"]`) for local dev against a React frontend

## 2. Project Structure

```
transitops-backend/
├── requirements.txt
├── seed.py                     # creates demo users + sample vehicles/drivers
├── API_REFERENCE.md
└── app/
    ├── main.py                 # FastAPI app, CORS, router registration, create_all()
    ├── database.py             # engine, SessionLocal, Base, get_db()
    ├── models.py                # SQLAlchemy models + enums (see DB schema doc)
    ├── schemas.py                # Pydantic request/response schemas
    ├── security.py              # hash_password, verify_password, JWT create/decode
    ├── deps.py                   # get_current_user, require_roles(*roles) dependency factory
    └── routers/
        ├── auth.py              # signup, login, /auth/me
        ├── vehicles.py           # Vehicle CRUD + filters + available pool
        ├── drivers.py             # Driver CRUD + filters + available pool
        ├── trips.py               # Trip create/dispatch/complete/cancel
        ├── maintenance.py         # Maintenance create/close
        ├── fuel_expenses.py       # Fuel logs + Expenses
        └── analytics.py           # Dashboard KPIs + vehicle reports + CSV export
```

## 3. Authentication & RBAC

- Roles: `fleet_manager`, `driver`, `safety_officer`, `financial_analyst`
- `POST /auth/signup` — body `{email, password, full_name, role}` → creates a user directly with the given role (this PS does not require restricted/admin-only role promotion the way some other ERP builds do — keep signup simple)
- `POST /auth/login` — body `{email, password}` → returns `{access_token, token_type, user}`
- `GET /auth/me` — returns the current authenticated user (requires bearer token)
- Every other endpoint requires `Authorization: Bearer <token>`
- Write/mutating endpoints are role-gated with a `require_roles(*roles)` dependency, e.g.:
  - Vehicle create/update/delete → `fleet_manager` only
  - Driver create/update → `fleet_manager` or `safety_officer`
  - Trip create/dispatch/complete/cancel → `fleet_manager` or `driver`
  - Maintenance create/close → `fleet_manager` only
- Reads (`GET`) are open to any authenticated role.
- JWT payload: `{"sub": "<user_id>", "role": "<role>", "exp": ...}`. Token expiry: 12 hours (convenient for a single demo day).

## 4. Vehicle Registry Endpoints (`/vehicles`)

- `POST /vehicles` — create. **Reject if `registration_number` already exists** (400 error).
- `GET /vehicles?status=&type=&region=&search=` — list, filterable; `search` matches registration number OR name/model (case-insensitive `LIKE`).
- `GET /vehicles/available/pool` — returns only vehicles with `status = Available`. **This is the dropdown source for Trip creation** — Retired/In Shop/On Trip vehicles must never appear here.
- `GET /vehicles/{id}`
- `PUT /vehicles/{id}` — partial update (only supplied fields change)
- `DELETE /vehicles/{id}` — block with 400 if the vehicle has any trip history; suggest setting status to `Retired` instead.

## 5. Driver Management Endpoints (`/drivers`)

- Same CRUD shape as Vehicles. **Reject duplicate `license_number`.**
- `GET /drivers/available/pool` — returns drivers where `status = Available` **and** `license_expiry_date > now`. Excludes Suspended, Off Duty, On Trip, and expired-license drivers. This is the dropdown source for Trip creation.
- `DELETE /drivers/{id}` — block if the driver has trip history; suggest setting status to `Off Duty` or `Suspended` instead.

## 6. Trip Management Endpoints (`/trips`)

Lifecycle: `Draft → Dispatched → Completed`, or `→ Cancelled` (cancellable from Draft or Dispatched).

- `POST /trips` — body: `{source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, revenue?}`. Status starts as `Draft`.
  - **Validate at creation** (immediate feedback while filling the form):
    - Vehicle must not be `Retired` or `In Shop` or already `On Trip`
    - Driver must not be `Suspended`, must not have `license_expiry_date <= now`, must not already be `On Trip`
    - `cargo_weight` must not exceed the vehicle's `max_load_capacity`
    - Any violation → 400 with a clear message (e.g. `"Vehicle {reg} is already On Trip."`)
- `POST /trips/{id}/dispatch` — **re-run the exact same validation** (state may have changed since Draft was created), then:
  - Set `vehicle.status = On Trip`, `driver.status = On Trip`
  - Set `trip.status = Dispatched`, stamp `dispatched_at`
  - Only allowed from `Draft` status; else 400.
- `POST /trips/{id}/complete` — body: `{final_odometer, fuel_consumed, revenue?}`.
  - Only allowed from `Dispatched` status; else 400.
  - `final_odometer` must be greater than the vehicle's current `odometer`; else 400.
  - Compute `trip.actual_distance = final_odometer - vehicle.odometer_before_update`
  - Set `vehicle.odometer = final_odometer`
  - Store `trip.fuel_consumed`, optionally overwrite `trip.revenue` if provided
  - Set `vehicle.status = Available`, `driver.status = Available`
  - Set `trip.status = Completed`, stamp `completed_at`
- `POST /trips/{id}/cancel`
  - Allowed from `Draft` or `Dispatched`; else 400.
  - If it was `Dispatched` (i.e. resources were held), restore `vehicle.status = Available` and `driver.status = Available`. If it was still `Draft`, nothing was held, so no status change needed on vehicle/driver.
  - Set `trip.status = Cancelled`, stamp `cancelled_at`.
- `GET /trips?status=&vehicle_id=&driver_id=`
- `GET /trips/{id}`

## 7. Maintenance Endpoints (`/maintenance`)

- `POST /maintenance` — body: `{vehicle_id, description, cost}`.
  - Reject with 400 if vehicle is currently `On Trip` (can't touch a vehicle mid-trip).
  - Creates the record with `status = Open`.
  - **Auto-flip vehicle to `In Shop`** — unless the vehicle is `Retired`, in which case it stays `Retired`.
- `POST /maintenance/{id}/close` — body: `{final_cost?}` (optional cost correction).
  - Reject with 400 if already `Closed`.
  - Set `status = Closed`, stamp `closed_at`.
  - **Auto-restore vehicle to `Available`** — but only if (a) the vehicle isn't `Retired`, and (b) there is no *other* still-`Open` maintenance record on the same vehicle (don't prematurely release a vehicle that has a second unrelated repair still in progress).
- `GET /maintenance?vehicle_id=&status=`
- `GET /maintenance/{id}`

## 8. Fuel & Expense Endpoints

- `POST /fuel-logs` / `GET /fuel-logs?vehicle_id=&trip_id=`
- `POST /expenses` / `GET /expenses?vehicle_id=&trip_id=&type=`
- Both optionally link to a `trip_id`. Validate the referenced `vehicle_id` (and `trip_id`, if given) exist, else 404.
- **These are the source of truth for cost aggregation in Analytics** — not the informational `fuel_consumed` field captured at trip completion (that field is per-trip display only, to avoid double-counting the same fuel purchase in vehicle-level totals).

## 9. Analytics & Reports Endpoints (`/analytics`)

- `GET /analytics/dashboard?vehicle_type=&region=` — KPI cards:
  - `active_vehicles` = count of non-Retired vehicles (after filters)
  - `available_vehicles` = count with `status = Available`
  - `vehicles_in_maintenance` = count with `status = In Shop`
  - `active_trips` = count of `Dispatched` trips
  - `pending_trips` = count of `Draft` trips
  - `drivers_on_duty` = drivers with `status` in `(Available, On Trip)` — i.e. clocked-in and workable, excluding Off Duty/Suspended
  - `fleet_utilization_percent` = (vehicles `On Trip` ÷ all non-Retired vehicles) × 100, rounded to 2 decimals; 0 if no non-Retired vehicles
- `GET /analytics/vehicles` — per-vehicle rollup, for every vehicle:
  - `total_distance` = sum of `actual_distance` over that vehicle's `Completed` trips
  - `total_fuel_liters`, `total_fuel_cost` = sums from `FuelLog` rows for that vehicle
  - `fuel_efficiency` = `total_distance / total_fuel_liters` (null if zero fuel logged)
  - `total_maintenance_cost` = sum of `Maintenance.cost` for that vehicle (all records, open or closed)
  - `total_operational_cost` = `total_fuel_cost + total_maintenance_cost`
  - `revenue` = sum of `Trip.revenue` over that vehicle's `Completed` trips
  - `roi` = `(revenue - total_operational_cost) / acquisition_cost` (null if `acquisition_cost` is 0, to avoid a divide-by-zero)
- `GET /analytics/vehicles/{id}` — same shape, single vehicle
- `GET /analytics/vehicles/export/csv` — same rows as above, returned as a downloadable CSV (`Content-Disposition: attachment`)

## 10. Design Decisions / Assumptions (flag these — the PS doesn't spell them out)

1. **Revenue field**: the ROI formula `(Revenue − (Maintenance + Fuel)) / Acquisition Cost` needs a Revenue number that isn't in the PS's listed entities. Add an optional `revenue` field on Trip (settable at creation or completion) representing the amount billed to the client for that trip.
2. **Fuel Efficiency / Fuel Cost source**: use `FuelLog` entries, not the `fuel_consumed` value captured at trip completion, to avoid counting the same fuel purchase twice.
3. **"Drivers On Duty"**: interpreted as `Available` + `On Trip` (workable), not a literal status value.
4. **Fleet Utilization %**: On Trip vehicles ÷ non-Retired vehicles.

## 11. Error Handling Conventions

- 400 — business rule violation (validation, duplicate key, invalid state transition) with a human-readable `detail` message
- 401 — missing/invalid/expired token
- 403 — authenticated but wrong role for this action
- 404 — referenced entity doesn't exist
- All error bodies: `{"detail": "..."}` (FastAPI default `HTTPException` shape)

## 12. Seed Data (for demo/frontend dev convenience)

Provide a `seed.py` script (idempotent — safe to re-run) that creates:
- One demo user per role, all with password `password123`:
  `fleetmanager@transitops.com`, `driver@transitops.com`, `safety@transitops.com`, `finance@transitops.com`
- 2 sample vehicles (status Available)
- 1 sample driver (status Available, license valid for 1 year)

## 13. Acceptance Test (must pass end-to-end)

Reproduce the PS's own example workflow (Section 5) exactly:
1. Register vehicle `Van-05`, max capacity 500kg → `Available`
2. Register driver `Alex` with valid license
3. Create trip with cargo weight 450kg → succeeds (450 ≤ 500); creating one with 600kg must be rejected
4. Dispatch the trip → vehicle & driver both flip to `On Trip`; a second trip attempt on the same vehicle/driver must be rejected
5. Complete the trip (enter final odometer + fuel) → vehicle & driver both flip back to `Available`; `actual_distance` is correctly derived from the odometer delta
6. Create a maintenance record on that vehicle → vehicle flips to `In Shop` and disappears from `/vehicles/available/pool`
7. Close the maintenance record → vehicle flips back to `Available`
8. Log fuel + check `/analytics/vehicles` → fuel efficiency, operational cost, and ROI are all numerically correct
9. Confirm RBAC: a `driver`-role user cannot `POST /vehicles` (403); an unauthenticated request to any protected route returns 401
