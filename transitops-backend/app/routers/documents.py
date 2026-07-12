"""
TransitOps — Vehicle Document Management router.
Upload, list, download, update, and delete vehicle documents
(insurance, registration, permits, inspection certificates, etc.).
"""

import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, require_roles
from ..models import DocumentType, User, Vehicle, VehicleDocument
from ..schemas import VehicleDocumentResponse, VehicleDocumentUpdate

router = APIRouter(prefix="/vehicles", tags=["Vehicle Documents"])

# Upload directory — relative to the project root
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _get_vehicle_or_404(vehicle_id: int, db: Session) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    return vehicle


def _get_document_or_404(vehicle_id: int, doc_id: int, db: Session) -> VehicleDocument:
    doc = (
        db.query(VehicleDocument)
        .filter(VehicleDocument.id == doc_id, VehicleDocument.vehicle_id == vehicle_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return doc


@router.post(
    "/{vehicle_id}/documents",
    response_model=VehicleDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("fleet_manager"))],
)
async def upload_document(
    vehicle_id: int,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    expiry_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a document for a vehicle. File is stored on the local filesystem."""
    _get_vehicle_or_404(vehicle_id, db)

    # Validate document type
    try:
        doc_type = DocumentType(document_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document_type '{document_type}'. Must be one of: {[t.value for t in DocumentType]}",
        )

    # Parse optional expiry_date
    parsed_expiry = None
    if expiry_date:
        try:
            parsed_expiry = datetime.fromisoformat(expiry_date)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid expiry_date format. Use ISO 8601 (e.g. 2025-12-31T00:00:00).",
            )

    # Create vehicle-specific upload directory
    vehicle_dir = os.path.join(UPLOAD_DIR, str(vehicle_id))
    os.makedirs(vehicle_dir, exist_ok=True)

    # Validate file type (allow only common document formats)
    ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".xls", ".xlsx"}
    ext = os.path.splitext(file.filename or "file")[1].lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{ext}' not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    
    # Read file content with size limit (10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    content = await file.read()
    
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size ({len(content)} bytes) exceeds maximum allowed size (10MB).",
        )
    
    # Sanitize filename to prevent path traversal
    safe_filename = os.path.basename(file.filename or "file")
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(vehicle_dir, unique_name)
    
    # Ensure file_path is still within UPLOAD_DIR (prevent path traversal)
    abs_file_path = os.path.abspath(file_path)
    abs_upload_dir = os.path.abspath(UPLOAD_DIR)
    if not abs_file_path.startswith(abs_upload_dir):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file path.",
        )

    # Write file to disk
    with open(file_path, "wb") as f:
        f.write(content)

    # Create DB record with sanitized filename
    doc = VehicleDocument(
        vehicle_id=vehicle_id,
        document_type=doc_type,
        file_name=safe_filename,
        file_path=file_path,
        uploaded_by_id=current_user.id,
        expiry_date=parsed_expiry,
        notes=notes,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{vehicle_id}/documents", response_model=list[VehicleDocumentResponse])
def list_documents(
    vehicle_id: int,
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """List all documents for a vehicle, with optional type filter."""
    _get_vehicle_or_404(vehicle_id, db)

    query = db.query(VehicleDocument).filter(VehicleDocument.vehicle_id == vehicle_id)

    if document_type:
        try:
            dtype = DocumentType(document_type)
            query = query.filter(VehicleDocument.document_type == dtype)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid document_type filter '{document_type}'.",
            )

    return query.order_by(VehicleDocument.created_at.desc()).all()


@router.get("/{vehicle_id}/documents/{doc_id}/download")
def download_document(
    vehicle_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Download a specific vehicle document."""
    doc = _get_document_or_404(vehicle_id, doc_id, db)

    if not os.path.exists(doc.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk. It may have been deleted externally.",
        )

    return FileResponse(
        path=doc.file_path,
        filename=doc.file_name,
        media_type="application/octet-stream",
    )


@router.put(
    "/{vehicle_id}/documents/{doc_id}",
    response_model=VehicleDocumentResponse,
    dependencies=[Depends(require_roles("fleet_manager"))],
)
def update_document(
    vehicle_id: int,
    doc_id: int,
    body: VehicleDocumentUpdate,
    db: Session = Depends(get_db),
):
    """Update document metadata (type, expiry date, notes)."""
    doc = _get_document_or_404(vehicle_id, doc_id, db)

    update_data = body.model_dump(exclude_unset=True)

    # Validate document_type if provided
    if "document_type" in update_data and update_data["document_type"] is not None:
        try:
            update_data["document_type"] = DocumentType(update_data["document_type"])
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid document_type. Must be one of: {[t.value for t in DocumentType]}",
            )

    for field, value in update_data.items():
        setattr(doc, field, value)

    db.commit()
    db.refresh(doc)
    return doc


@router.delete(
    "/{vehicle_id}/documents/{doc_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_roles("fleet_manager"))],
)
def delete_document(
    vehicle_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
):
    """Delete a document record and remove the file from disk."""
    doc = _get_document_or_404(vehicle_id, doc_id, db)

    # Remove file from disk (best-effort)
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    db.delete(doc)
    db.commit()
    return {"detail": f"Document '{doc.file_name}' deleted successfully."}
