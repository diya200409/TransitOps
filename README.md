# TransitOps 🚚

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://www.python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Smart Transport Operations Platform** - A comprehensive fleet management system that digitalizes vehicle, driver, trip, maintenance, fuel, and expense operations.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Demo Credentials](#-demo-credentials)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Team](#-team)
- [License](#-license)

---

## 🎯 Overview

TransitOps is a **production-ready, full-stack fleet management system** designed to eliminate spreadsheets and manual logbooks from transport operations. Built with modern web technologies, it provides real-time operational visibility, automated workflows, and comprehensive analytics.

### Why TransitOps?

- ✅ **Automated Workflows** - Trip lifecycle automation with status synchronization
- ✅ **Real-time Tracking** - Live fleet status, driver availability, and maintenance alerts
- ✅ **Data-Driven Insights** - ROI calculations, fuel efficiency metrics, expense analytics
- ✅ **Role-Based Access** - 4 user roles with granular permissions
- ✅ **Scalable Architecture** - Production-grade security with comprehensive test coverage

---

## ✨ Features

### 🚗 **Vehicle Management**
- Complete vehicle registry with status tracking
- Document management (insurance, registration, permits)
- Regional filtering and search
- Availability pool for trip assignment
- Soft delete protection

### 👨‍✈️ **Driver Management**
- Driver profiles with license tracking
- License expiry alerts with email reminders
- Safety score monitoring
- Status management (Available, On Trip, Off Duty, Suspended)
- Automatic availability validation

### 🚚 **Trip Management**
- Full lifecycle automation: Draft → Dispatched → Completed
- Dispatch validation (vehicle capacity, driver license, availability)
- Automatic resource allocation
- Odometer-based distance calculation
- Revenue tracking per trip
- Race condition prevention with database locking

### 🔧 **Maintenance Tracking**
- Schedule and track maintenance records
- Automatic vehicle status transitions
- Multi-maintenance handling
- Cost tracking and completion dates
- Service type categorization

### ⛽ **Fuel & Expense Management**
- Fuel log tracking (liters, cost, date)
- Expense categorization (Toll, Maintenance, Other)
- Optional trip association
- Summary analytics with KPI cards

### 📊 **Analytics & Reports**
- 8 real-time dashboard KPIs
- Per-vehicle ROI and efficiency metrics
- Fuel efficiency calculations (km/liter)
- CSV & PDF export functionality
- Customizable filters (vehicle type, region, status)

### 🔐 **Authentication & Security**
- JWT-based authentication (12-hour token expiry)
- 4 user roles: Fleet Manager, Driver, Safety Officer, Financial Analyst
- Password strength enforcement
- Automatic token cleanup on 401 errors
- CORS hardening and input validation

---

## 📸 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)
*Real-time KPI dashboard with fleet utilization charts*

### Vehicle Management
![Vehicles](docs/screenshots/vehicles.png)
*Complete vehicle registry with status indicators*

### Trip Dispatch
![Trips](docs/screenshots/trips.png)
*Trip creation with automated validation*

---

## 🛠️ Tech Stack

### **Frontend**
- **React 19.2.7** - Latest React with concurrent features
- **Vite 8.1.1** - Lightning-fast build tool
- **Tailwind CSS 4.3.2** - Modern utility-first CSS
- **React Router 7.18.1** - Client-side routing
- **Recharts 3.9.2** - Beautiful data visualizations
- **Lucide React** - Elegant icon set
- **Vitest** - Fast unit testing framework

### **Backend**
- **FastAPI 0.115.0** - High-performance Python web framework
- **SQLAlchemy 2.0.32** - Powerful ORM with type safety
- **Pydantic 2.9.0** - Data validation using Python type hints
- **JWT (python-jose)** - Secure token-based authentication
- **Bcrypt 4.2.0** - Password hashing
- **Alembic 1.13.2** - Database migrations
- **FPDF2 2.8.3** - PDF report generation
- **Uvicorn** - ASGI server for production

### **Database**
- **SQLite** - File-based database (development)
- Ready for PostgreSQL/MySQL migration

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Installation

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/diya200409/TransitOps.git
cd TransitOps
```

#### 2️⃣ Backend Setup
```bash
cd transitops-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed database with demo data
python seed.py

# Start backend server
uvicorn app.main:app --reload
```
Backend will run on: http://localhost:8000

#### 3️⃣ Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend will run on: http://localhost:5173

#### 🎬 **Automated Startup (Windows)**
```bash
START_PROJECT.bat
```
Opens both backend and frontend in separate terminals.

---

## 📁 Project Structure

```text
TransitOps/
│
├── frontend/                       # React frontend
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── common/           # Generic components (Modal, DataTable, etc.)
│   │   │   ├── dashboard/        # Dashboard-specific components
│   │   │   ├── drivers/          # Driver management components
│   │   │   ├── layout/           # Layout components (Sidebar, TopBar)
│   │   │   ├── maintenance/      # Maintenance components
│   │   │   ├── trips/            # Trip management components
│   │   │   └── vehicles/         # Vehicle components
│   │   ├── pages/                # Page components
│   │   ├── api/                  # API integration modules
│   │   ├── hooks/                # Custom React hooks
│   │   ├── context/              # React context providers
│   │   ├── constants/            # Constants and enums
│   │   ├── utils/                # Utility functions
│   │   └── test/                 # Test files
│   ├── public/                    # Static assets
│   └── package.json
│
├── transitops-backend/            # FastAPI backend
│   ├── app/
│   │   ├── routers/              # API route handlers
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── vehicles.py      # Vehicle CRUD
│   │   │   ├── drivers.py       # Driver management
│   │   │   ├── trips.py         # Trip lifecycle
│   │   │   ├── maintenance.py   # Maintenance tracking
│   │   │   ├── fuel_expenses.py # Fuel & expenses
│   │   │   ├── analytics.py     # Reports & analytics
│   │   │   └── documents.py     # Document management
│   │   ├── models.py             # SQLAlchemy ORM models
│   │   ├── schemas.py            # Pydantic validation schemas
│   │   ├── database.py           # Database connection
│   │   ├── config.py             # Configuration management
│   │   ├── deps.py               # Dependency injection
│   │   ├── security.py           # Auth & password utilities
│   │   └── main.py               # FastAPI app entry point
│   ├── alembic/                   # Database migrations
│   ├── uploads/                   # Document storage
│   ├── seed.py                    # Database seeding script
│   └── requirements.txt
│
├── docs/                           # Documentation
│   ├── FRONTEND_INTEGRATION_GUIDE.md
│   ├── API_REFERENCE.md
│   ├── SECURITY_FIXES.md
│   └── screenshots/
│
├── START_PROJECT.bat              # Windows startup script
├── .gitignore
└── README.md
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:8000
```

### Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

### Key Endpoints

#### **Authentication**
```http
POST /auth/signup        # Create user account
POST /auth/login         # Login (returns JWT token)
GET  /auth/me            # Get current user profile
```

#### **Vehicles**
```http
GET    /vehicles                   # List vehicles (with filters)
POST   /vehicles                   # Create vehicle (fleet_manager only)
GET    /vehicles/{id}              # Get single vehicle
PUT    /vehicles/{id}              # Update vehicle
DELETE /vehicles/{id}              # Delete vehicle
GET    /vehicles/available/pool    # Available vehicles for dispatch
```

#### **Drivers**
```http
GET  /drivers                        # List drivers
POST /drivers                        # Create driver
GET  /drivers/{id}                   # Get driver details
PUT  /drivers/{id}                   # Update driver
GET  /drivers/available/pool         # Available drivers
GET  /drivers/expiring-licenses      # Get expiring licenses
POST /drivers/send-expiry-reminders  # Send email alerts
```

#### **Trips**
```http
GET  /trips                  # List trips (with filters)
POST /trips                  # Create trip (Draft status)
POST /trips/{id}/dispatch    # Dispatch trip
POST /trips/{id}/complete    # Complete trip
POST /trips/{id}/cancel      # Cancel trip
GET  /trips/{id}             # Get trip details
```

#### **Analytics**
```http
GET /analytics/dashboard              # Dashboard KPIs
GET /analytics/vehicles               # Per-vehicle analytics
GET /analytics/vehicles/export/csv    # Export CSV report
GET /analytics/vehicles/export/pdf    # Export PDF report
```

📖 **Full API Documentation**: [API_REFERENCE.md](docs/API_REFERENCE.md)

---

## 🔑 Demo Credentials

```javascript
// Fleet Manager (Full Access)
Email: fleetmanager@transitops.com
Password: password123

// Driver (Limited Access)
Email: driver@transitops.com
Password: password123

// Safety Officer (Driver Management)
Email: safety@transitops.com
Password: password123

// Financial Analyst (Reports Only)
Email: finance@transitops.com
Password: password123
```

---

## 💻 Development

### Environment Variables

#### Backend (`.env`)
```bash
# Required in production
TRANSITOPS_SECRET_KEY=your-secret-key-here

# CORS origins (comma-separated)
TRANSITOPS_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# JWT settings
TRANSITOPS_JWT_ALGORITHM=HS256
TRANSITOPS_ACCESS_TOKEN_EXPIRE_HOURS=12

# SMTP (optional - for email alerts)
TRANSITOPS_SMTP_HOST=smtp.gmail.com
TRANSITOPS_SMTP_PORT=587
TRANSITOPS_SMTP_USER=your-email@gmail.com
TRANSITOPS_SMTP_PASSWORD=your-app-password
```

#### Frontend (`.env`)
```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Database Migrations
```bash
cd transitops-backend

# Generate migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Code Quality
```bash
# Backend linting
ruff check .
black .

# Frontend linting
npm run lint
```

---

## 🧪 Testing

### Backend Tests
```bash
cd transitops-backend

# Run security validation tests
python test_security_fixes.py

# Run end-to-end tests
python test_e2e.py
```

### Frontend Tests
```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 🚢 Deployment

### Backend (FastAPI)

#### Heroku
```bash
# Install Heroku CLI
heroku create transitops-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set TRANSITOPS_SECRET_KEY=your-secret-key

# Deploy
git subtree push --prefix transitops-backend heroku main
```

#### Railway
```bash
railway init
railway add postgresql
railway up
```

### Frontend (React)

#### Vercel
```bash
cd frontend
vercel --prod
```

#### Netlify
```bash
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass

---

## 👥 Team

**2-Member Hackathon Team**

### Frontend & Full-Stack Integration
- Dashboard development
- Vehicle & Driver management UI
- API integration
- Responsive design
- Testing & documentation

### Backend & Business Logic
- FastAPI architecture
- Database design
- Authentication & authorization
- Trip management & dispatch validation
- Analytics & reporting
- Security hardening

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built as part of an 8-hour hackathon challenge
- Inspired by real-world fleet management challenges
- Powered by modern open-source technologies

---

## 📞 Support

For issues and questions:
- 🐛 [Report Bug](https://github.com/diya200409/TransitOps/issues)
- 💡 [Request Feature](https://github.com/diya200409/TransitOps/issues)
- 📧 Email: diyaumale9@gmail.com

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with ❤️ by the TransitOps Team

</div>