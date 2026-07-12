"""
TransitOps — FastAPI application entry point.
CORS enabled for React frontend, all routers registered, DB tables created on startup.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import (
    analytics,
    auth,
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

# CORS — wide open for local dev against React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(drivers.router)
app.include_router(trips.router)
app.include_router(maintenance.router)
app.include_router(fuel_expenses.router)
app.include_router(analytics.router)


@app.get("/", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "TransitOps API", "version": "1.0.0"}
