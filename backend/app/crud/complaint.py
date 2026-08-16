from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.models.document import ComplaintDocument
from app.schemas.complaint import ComplaintCreate, ComplaintUpdate


def create_complaint(db: Session, data: ComplaintCreate) -> Complaint:
    complaint = Complaint(**data.model_dump())
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


def get_complaint(db: Session, complaint_id: str) -> Complaint | None:
    return db.get(Complaint, complaint_id)


def list_complaints(db: Session, skip: int = 0, limit: int = 50) -> list[Complaint]:
    stmt = select(Complaint).order_by(Complaint.created_at.desc()).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


def update_complaint(db: Session, complaint_id: str, data: ComplaintUpdate) -> Complaint | None:
    complaint = get_complaint(db, complaint_id)
    if not complaint:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(complaint, field, value)
    db.commit()
    db.refresh(complaint)
    return complaint


def delete_complaint(db: Session, complaint_id: str) -> bool:
    complaint = get_complaint(db, complaint_id)
    if not complaint:
        return False
    db.delete(complaint)
    db.commit()
    return True


def list_recent_for_duplicate_check(db: Session, limit: int = 100) -> list[Complaint]:
    """Pull recent complaints so the duplicate_detection_node has something to compare against."""
    stmt = select(Complaint).order_by(Complaint.created_at.desc()).limit(limit)
    return list(db.scalars(stmt).all())


def attach_document_to_complaint(db: Session, document_id: str, complaint_id: str) -> ComplaintDocument | None:
    """Links a previously logged ComplaintDocument (from an extraction run) to the
    complaint that was ultimately saved from it - closes the audit-trail loop between
    'what was uploaded' and 'what got recorded'."""
    document = db.get(ComplaintDocument, document_id)
    if not document:
        return None
    document.complaint_id = complaint_id
    db.commit()
    db.refresh(document)
    return document


def get_documents_for_complaint(db: Session, complaint_id: str) -> list[ComplaintDocument]:
    stmt = (
        select(ComplaintDocument)
        .where(ComplaintDocument.complaint_id == complaint_id)
        .order_by(ComplaintDocument.created_at.desc())
    )
    return list(db.scalars(stmt).all())


def bulk_update_status(db: Session, complaint_ids: list[str], status: str) -> int:
    """Batch status transition - e.g. moving several complaints from
    'pending_triage' to 'under_review' after a QA huddle. Returns count updated."""
    stmt = select(Complaint).where(Complaint.id.in_(complaint_ids))
    complaints = list(db.scalars(stmt).all())
    for c in complaints:
        c.status = status
    db.commit()
    return len(complaints)