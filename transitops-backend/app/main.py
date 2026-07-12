"""
TransitOps — FastAPI application entry point.
CORS enabled for React frontend, all routers registered, DB tables created on startup.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_cors_origins
from .database import Base, engine
from .routers import (
    analytics,
    auth,
    documents,
    drivers,
    fuel_expenses,
    maintenance,
    trips,
    users,
    vehicles,
)

# Create all tables on startup and automatically seed demo data if database is empty
Base.metadata.create_all(bind=engine)
try:
    from .database import SessionLocal
    from .models import User
    with SessionLocal() as _db:
        if _db.query(User).first() is None:
            import sys
            from pathlib import Path
            _backend_dir = Path(__file__).parent.parent
            if str(_backend_dir) not in sys.path:
                sys.path.insert(0, str(_backend_dir))
            import seed
            print("Database empty upon startup. Automatically running initial seed...")
            seed.seed()
except Exception as _e:
    print(f"Startup check/seed note: {_e}")


app = FastAPI(
    title="TransitOps API",
    description="Smart Transport Operations Platform — Fleet, Driver, Trip, Maintenance, and Analytics Management",
    version="1.0.0",
)

# CORS — restricted to configured origins or allowed regex for deployment flexibility
# Production deployments MUST set TRANSITOPS_CORS_ORIGINS environment variable (or * / Railway URLs)
_origins = get_cors_origins()
_cors_origins = [o for o in _origins if o != "*"]
_allow_regex = r".*" if "*" in _origins else r"https://.*\.up\.railway\.app|https://.*\.onrender\.com|https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+"

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,  # Explicitly configured origins
    allow_origin_regex=_allow_regex,  # Handles Railway/Vercel/Render subdomains & wildcards gracefully
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(vehicles.router)
app.include_router(drivers.router)
app.include_router(trips.router)
app.include_router(maintenance.router)
app.include_router(fuel_expenses.router)
app.include_router(analytics.router)
app.include_router(documents.router)


@app.get("/", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "TransitOps API", "version": "1.0.0"}
