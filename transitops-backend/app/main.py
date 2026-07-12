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
    vehicles,
)

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TransitOps API",
    description="Smart Transport Operations Platform — Fleet, Driver, Trip, Maintenance, and Analytics Management",
    version="1.0.0",
)

# CORS — restricted to configured origins for security
# Production deployments MUST set TRANSITOPS_CORS_ORIGINS environment variable
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),  # Explicitly configured origins only
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicit methods
    allow_headers=["Authorization", "Content-Type"],  # Explicit headers
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Register routers
app.include_router(auth.router)
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
