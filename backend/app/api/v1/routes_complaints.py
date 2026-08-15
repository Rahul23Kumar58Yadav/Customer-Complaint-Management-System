import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.complaint import Complaint, ComplaintStatus, SeverityLevel
from app.schemas.complaint import ComplaintCreate, ComplaintUpdate, ComplaintOut, ComplaintListResponse
from app.crud import complaint as crud

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.post("", response_model=ComplaintOut, status_code=201)
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    complaint = crud.create_complaint(db, payload)
    logger.info("Complaint created id=%s product=%s", complaint.id, complaint.product_name)
    return complaint


@router.get("", response_model=ComplaintListResponse)
def list_complaints(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status_filter: ComplaintStatus | None = Query(None, alias="status"),
    severity: SeverityLevel | None = None,
    risk_classification: str | None = Query(
        None, description="Filter by AI risk classification, e.g. 'High Risk'"
    ),
    search: str | None = Query(
        None, description="Free-text search across customer, product, batch, and description"
    ),
    db: Session = Depends(get_db),
):
    """List complaints with optional filtering, search, and pagination metadata."""
    stmt = select(Complaint)
    count_stmt = select(func.count()).select_from(Complaint)

    if status_filter:
        stmt = stmt.where(Complaint.status == status_filter)
        count_stmt = count_stmt.where(Complaint.status == status_filter)
    if severity:
        stmt = stmt.where(Complaint.initial_severity == severity)
        count_stmt = count_stmt.where(Complaint.initial_severity == severity)
    if risk_classification:
        stmt = stmt.where(Complaint.ai_risk_classification == risk_classification)
        count_stmt = count_stmt.where(Complaint.ai_risk_classification == risk_classification)
    if search:
        pattern = f"%{search}%"
        search_clause = or_(
            Complaint.customer_name.ilike(pattern),
            Complaint.product_name.ilike(pattern),
            Complaint.batch_lot_number.ilike(pattern),
            Complaint.detailed_description.ilike(pattern),
        )
        stmt = stmt.where(search_clause)
        count_stmt = count_stmt.where(search_clause)

    total = db.scalar(count_stmt) or 0
    items = list(
        db.scalars(stmt.order_by(Complaint.created_at.desc()).offset(skip).limit(limit)).all()
    )

    return ComplaintListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    complaint = crud.get_complaint(db, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.put("/{complaint_id}", response_model=ComplaintOut)
def update_complaint(complaint_id: str, payload: ComplaintUpdate, db: Session = Depends(get_db)):
    complaint = crud.update_complaint(db, complaint_id, payload)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    logger.info("Complaint updated id=%s", complaint_id)
    return complaint


@router.delete("/{complaint_id}", status_code=204)
def delete_complaint(complaint_id: str, db: Session = Depends(get_db)):
    if not crud.delete_complaint(db, complaint_id):
        raise HTTPException(status_code=404, detail="Complaint not found")
    logger.info("Complaint deleted id=%s", complaint_id)


@router.get("/stats/summary")
def complaint_stats(db: Session = Depends(get_db)):
    """Lightweight dashboard aggregate - counts by status and by AI risk classification."""
    by_status = dict(
        db.execute(select(Complaint.status, func.count()).group_by(Complaint.status)).all()
    )
    by_risk = dict(
        db.execute(
            select(Complaint.ai_risk_classification, func.count())
            .where(Complaint.ai_risk_classification.is_not(None))
            .group_by(Complaint.ai_risk_classification)
        ).all()
    )
    total = db.scalar(select(func.count()).select_from(Complaint)) or 0
    return {"total": total, "by_status": by_status, "by_risk_classification": by_risk}