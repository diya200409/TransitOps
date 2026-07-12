# TransitOps — Database Schema Spec

SQLite database, accessed via SQLAlchemy ORM. 7 tables total: `users`, `vehicles`, `drivers`, `trips`, `maintenance_records`, `fuel_logs`, `expenses`.

## Enums

```
UserRole:          fleet_manager | driver | safety_officer | financial_analyst
VehicleStatus:     Available | On Trip | In Shop | Retired
DriverStatus:      Available | On Trip | Off Duty | Suspended
TripStatus:        Draft | Dispatched | Completed | Cancelled
MaintenanceStatus: Open | Closed
ExpenseType:       Toll | Maintenance | Other
```

## Table: `users`

Authentication + RBAC. Not a PS-listed "master data" entity, but required to support Section 3.1 (login/RBAC).

| Field | Type | Constraints |
|---|---|---|
| id | Integer | PK, autoincrement |
| email | String | unique, indexed, not null |
| hashed_password | String | not null |
| full_name | String | not null |
| role | Enum(UserRole) | not null |
| is_active | Boolean | default true |
| created_at | DateTime | default now |
| driver_id | Integer | FK → drivers.id, nullable — optional link if this login belongs to a specific Driver profile |

## Table: `vehicles`

Vehicle Registry (Section 3.3).

| Field | Type | Constraints |
|---|---|---|
| id | Integer | PK |
| registration_number | String | **unique**, indexed, not null |
| name_model | String | not null |
| type | String | not null (e.g. Truck, Van, Bike — free text or its own lookup table) |
| max_load_capacity | Float | not null, > 0 (kg) |
| odometer | Float | default 0 |
| acquisition_cost | Float | not null, ≥ 0 |
| status | Enum(VehicleStatus) | default `Available`, not null |
| region | String | nullable — used for dashboard filtering |
| created_at | DateTime | default now |
| updated_at | DateTime | default now, on update → now |

**Relationships:** has many `trips`, `maintenance_records`, `fuel_logs`, `expenses`.

## Table: `drivers`

Driver Management (Section 3.4).

| Field | Type | Constraints |
|---|---|---|
| id | Integer | PK |
| name | String | not null |
| license_number | String | **unique**, indexed, not null |
| license_category | String | not null |
| license_expiry_date | DateTime | not null |
| contact_number | String | not null |
| safety_score | Float | default 100.0 |
| status | Enum(DriverStatus) | default `Available`, not null |
| created_at | DateTime | default now |
| updated_at | DateTime | default now, on update → now |

**Relationships:** has many `trips`; optionally has one `user_account` (back-reference from `users.driver_id`).

## Table: `trips`

Trip Management (Section 3.5).

| Field | Type | Constraints |
|---|---|---|
| id | Integer | PK |
| source | String | not null |
| destination | String | not null |
| vehicle_id | Integer | FK → vehicles.id, not null |
| driver_id | Integer | FK → drivers.id, not null |
| cargo_weight | Float | not null, > 0 (kg) |
| planned_distance | Float | not null, > 0 |
| actual_distance | Float | nullable — filled on completion, derived from odometer delta |
| fuel_consumed | Float | nullable — liters, filled on completion (per-trip informational value) |
| revenue | Float | default 0.0, not null — **not in the original PS entity list**; added because the Vehicle ROI formula (Section 3.8) requires a revenue figure. Represents amount billed for this trip. |
| status | Enum(TripStatus) | default `Draft`, not null |
| created_by_id | Integer | FK → users.id, nullable |
| created_at | DateTime | default now |
| dispatched_at | DateTime | nullable |
| completed_at | DateTime | nullable |
| cancelled_at | DateTime | nullable |

**Relationships:** belongs to one `vehicle`, one `driver`; has many `fuel_logs`, `expenses` (optionally linked).

## Table: `maintenance_records`

Maintenance (Section 3.6).

| Field | Type | Constraints |
|---|---|---|
| id | Integer | PK |
| vehicle_id | Integer | FK → vehicles.id, not null |
| description | Text | not null |
| cost | Float | default 0.0 |
| status | Enum(MaintenanceStatus) | default `Open`, not null |
| created_at | DateTime | default now |
| closed_at | DateTime | nullable |

**Relationships:** belongs to one `vehicle`.

## Table: `fuel_logs`

Fuel & Expense Management (Section 3.7) — fuel portion.

| Field | Type | Constraints |
|---|---|---|
| id | Integer | PK |
| vehicle_id | Integer | FK → vehicles.id, not null |
| trip_id | Integer | FK → trips.id, nullable |
| liters | Float | not null, > 0 |
| cost | Float | not null, ≥ 0 |
| date | DateTime | default now |

**Relationships:** belongs to one `vehicle`; optionally belongs to one `trip`.

**Role in analytics:** this table (not `trips.fuel_consumed`) is the source of truth for total fuel cost/liters per vehicle in Reports & Analytics — keeps the same fuel purchase from being counted twice.

## Table: `expenses`

Fuel & Expense Management (Section 3.7) — non-fuel costs (tolls, misc).

| Field | Type | Constraints |
|---|---|---|
| id | Integer | PK |
| vehicle_id | Integer | FK → vehicles.id, not null |
| trip_id | Integer | FK → trips.id, nullable |
| type | Enum(ExpenseType) | not null |
| amount | Float | not null, > 0 |
| date | DateTime | default now |
| description | String | nullable |

**Relationships:** belongs to one `vehicle`; optionally belongs to one `trip`.

## Entity-Relationship Summary

```
users ──(optional 1:1)── drivers
vehicles ──(1:many)── trips
drivers  ──(1:many)── trips
vehicles ──(1:many)── maintenance_records
vehicles ──(1:many)── fuel_logs ──(optional many:1)── trips
vehicles ──(1:many)── expenses  ──(optional many:1)── trips
```

## Referential Integrity Rules (enforce at the application layer, not just FK constraints)

- Do not hard-delete a `vehicle` or `driver` that has any `trips` referencing it — block the delete and suggest a status change instead (`Retired` for vehicles, `Off Duty`/`Suspended` for drivers).
- `registration_number` (vehicles) and `license_number` (drivers) must be validated as unique **before** insert, with a clear 400 error naming the conflicting value — don't rely solely on the DB unique-constraint exception bubbling up.
- `trip.vehicle_id` / `trip.driver_id` and the vehicle/driver's live `status` field must always stay in sync via the state-transition rules described in `TransitOps_Backend_Spec.md` Section 6 — the DB schema itself doesn't enforce this, the API layer must.
