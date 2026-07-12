# TransitOps Frontend Specification

> This document is maintained by the frontend team.
> It describes the React + Vite + Tailwind frontend for TransitOps.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 8 | Build tool & dev server |
| Tailwind CSS v4 | Utility-first styling |
| React Router v7 | Client-side routing |
| Lucide React | Icon library |
| Recharts | Chart visualizations |

---

## Scope

### ✅ In Scope (this team)
- Login page (consumes `/auth/login`)
- Dashboard with 7 KPI cards + Recharts visualizations
- Vehicle Management — full CRUD, search, filter
- Driver Management — full CRUD, search, filter, license expiry warnings
- Sidebar navigation + TopBar
- Role-aware UI (Fleet Manager = full CRUD; others = read-only)
- Responsive layout (desktop / tablet / mobile)

### 🚫 Out of Scope (backend team)
- Trip Management UI
- Maintenance Log UI
- Fuel & Expense UI
- Reports & Analytics UI
- Backend auth logic / RBAC enforcement
- Email/notification systems

---

## Project Structure

```
frontend/
├── src/
│   ├── api/            # Centralized API calls (client.js + per-module)
│   ├── components/
│   │   ├── common/     # Shared UI components (KPICard, Modal, DataTable…)
│   │   └── layout/     # Sidebar, TopBar, AppLayout
│   ├── constants/      # Status enums + color maps
│   ├── context/        # AuthContext (user, token, role)
│   ├── hooks/          # Custom data-fetching hooks
│   ├── pages/          # Route-level page components
│   └── utils/          # Formatters, validators
├── .env                # VITE_API_BASE_URL
├── vite.config.js
└── package.json
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | FastAPI backend base URL |

---

## API Base URL

All API calls are made through `src/api/client.js`.
Set `VITE_API_BASE_URL` in `.env` to point at the backend.

---

## User Roles (Frontend Behaviour)

| Role | Access |
|---|---|
| `fleet_manager` | Full CRUD on Vehicles & Drivers |
| `dispatcher` | Read-only |
| `safety_officer` | Read-only |
| `financial_analyst` | Read-only |

---

## Running Locally

```bash
cd frontend
npm install
npm run dev        # starts at http://localhost:5173
```

---

*For backend API contracts, refer to `../TransitOps_Backend_Spec.md`.*
*For database schema, refer to `../TransitOps_Database_Schema.md`.*
