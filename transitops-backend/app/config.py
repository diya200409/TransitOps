"""
Runtime configuration for TransitOps.

Production deployments should set TRANSITOPS_SECRET_KEY and
TRANSITOPS_CORS_ORIGINS explicitly. Local development keeps narrow defaults.
"""

import os
import secrets
import sys
from pathlib import Path

# Load .env from backend root if it exists (dev convenience)
_env_file = Path(__file__).parent.parent / ".env"
if _env_file.exists():
    for _line in _env_file.read_text().splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _, _v = _line.partition("=")
            os.environ.setdefault(_k.strip(), _v.strip())


# Critical: SECRET_KEY must be set in production to avoid token invalidation on restart
SECRET_KEY = os.getenv("TRANSITOPS_SECRET_KEY")
if SECRET_KEY is None:
    print("WARNING: TRANSITOPS_SECRET_KEY not set. Using auto-generated key for development only.", file=sys.stderr)
    print("WARNING: All tokens will be invalidated on server restart!", file=sys.stderr)
    SECRET_KEY = secrets.token_urlsafe(32)
ALGORITHM = os.getenv("TRANSITOPS_JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("TRANSITOPS_ACCESS_TOKEN_EXPIRE_HOURS", "12"))

DEFAULT_CORS_ORIGINS = (
    "http://localhost:3000,"
    "http://127.0.0.1:3000,"
    "http://localhost:5173,"
    "http://127.0.0.1:5173"
)


def get_cors_origins() -> list[str]:
    origins = os.getenv("TRANSITOPS_CORS_ORIGINS", DEFAULT_CORS_ORIGINS)
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


ALLOW_PUBLIC_PRIVILEGED_SIGNUP = (
    os.getenv("TRANSITOPS_ALLOW_PUBLIC_PRIVILEGED_SIGNUP", "false").lower()
    in {"1", "true", "yes", "on"}
)


# ── SMTP Configuration ──────────────────────────────────────────────────────

SMTP_HOST = os.getenv("TRANSITOPS_SMTP_HOST", "")
SMTP_PORT = int(os.getenv("TRANSITOPS_SMTP_PORT", "587"))
SMTP_USER = os.getenv("TRANSITOPS_SMTP_USER", "")
SMTP_PASSWORD = os.getenv("TRANSITOPS_SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("TRANSITOPS_SMTP_FROM", "")
SMTP_USE_TLS = os.getenv("TRANSITOPS_SMTP_USE_TLS", "true").lower() in {"1", "true", "yes", "on"}
