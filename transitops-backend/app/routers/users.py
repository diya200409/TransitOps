"""
TransitOps — Users router.
Exposes GET /users/me and PUT /users/me for authenticated profile management.
"""

import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import UserResponse
from ..security import hash_password, verify_password

router = APIRouter(prefix="/users", tags=["Users"])


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_my_profile(
    body: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update name and/or email of the authenticated user."""
    if body.email and body.email != current_user.email:
        existing = db.query(User).filter(User.email == body.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{body.email}' is already in use by another account.",
            )
        current_user.email = body.email

    if body.full_name is not None:
        current_user.full_name = body.full_name

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/password", status_code=status.HTTP_200_OK)
def change_my_password(
    body: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change the authenticated user's password. Requires current password verification."""
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    # Validate new password strength
    pw = body.new_password
    errors = []
    if len(pw) < 8:
        errors.append("at least 8 characters")
    if not re.search(r"[A-Z]", pw):
        errors.append("one uppercase letter")
    if not re.search(r"[a-z]", pw):
        errors.append("one lowercase letter")
    if not re.search(r"\d", pw):
        errors.append("one digit")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', pw):
        errors.append('one special character (!@#$%^&*(),.?":{}|<>)')
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"New password must contain: {', '.join(errors)}.",
        )

    current_user.hashed_password = hash_password(pw)
    db.commit()
    return {"detail": "Password updated successfully."}
