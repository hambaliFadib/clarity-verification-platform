import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models.requirement import Requirement, RequirementTestCase, RequirementComment
from app.models.test_case import TestCase
from app.schemas.requirement import RequirementCreate, RequirementUpdate, RequirementResponse

router = APIRouter(prefix="/requirements", tags=["Requirements"])

def generate_display_id(db: Session, module_abbr: str = "REQ") -> str:
    count = db.scalar(select(func.count(Requirement.id))) or 0
    return f"{module_abbr}-{(count + 1):03d}"

@router.get("/", response_model=list[RequirementResponse])
def get_requirements(
    db: Session = Depends(get_db_session),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    requirements = db.scalars(
        select(Requirement)
        .order_by(Requirement.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()
    return requirements

@router.post("/", response_model=RequirementResponse, status_code=status.HTTP_201_CREATED)
def create_requirement(
    req_in: RequirementCreate,
    db: Session = Depends(get_db_session),
) -> Any:
    db_req = Requirement(
        **req_in.model_dump(),
        display_id=generate_display_id(db),
        status="Draft"
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req


@router.get("/traceability/all", response_model=list[dict])
def get_traceability_matrix_all(
    db: Session = Depends(get_db_session),
) -> Any:
    """Get full traceability matrix."""
    from app.services.requirement import get_traceability_matrix
    return get_traceability_matrix(db)


@router.get("/stats/all", response_model=dict)
def get_statistics(
    db: Session = Depends(get_db_session),
) -> Any:
    """Get requirement statistics."""
    from app.services.requirement import get_requirement_statistics
    return get_requirement_statistics(db)

@router.get("/{requirement_id}/traceability", response_model=dict)
def get_requirement_traceability(
    requirement_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    from app.services.requirement import get_traceability_matrix
    matrix = get_traceability_matrix(db)
    # Filter for this requirement
    for item in matrix:
        if getattr(item["requirement"], "id", None) == requirement_id:
            return item
    raise HTTPException(status_code=404, detail="Requirement not found in traceability matrix")


@router.get("/{requirement_id}", response_model=RequirementResponse)
def get_requirement(
    requirement_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    db_req = db.get(Requirement, requirement_id)
    if not db_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requirement not found")
    return db_req

@router.patch("/{requirement_id}", response_model=RequirementResponse)
def update_requirement(
    requirement_id: uuid.UUID,
    req_in: RequirementUpdate,
    db: Session = Depends(get_db_session),
) -> Any:
    db_req = db.get(Requirement, requirement_id)
    if not db_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requirement not found")
    
    update_data = req_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_req, field, value)
        
    db.commit()
    db.refresh(db_req)
    return db_req

@router.delete("/{requirement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_requirement(
    requirement_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Response:
    db_req = db.get(Requirement, requirement_id)
    if not db_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requirement not found")

    db.delete(db_req)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/{requirement_id}/test-cases", response_model=list[dict])
def get_linked_test_cases(
    requirement_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    """Get test cases linked to a requirement."""
    requirement = db.get(Requirement, requirement_id)
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    test_cases = db.scalars(
        select(TestCase)
        .join(RequirementTestCase)
        .where(RequirementTestCase.requirement_id == requirement_id)
    ).all()
    
    return [
        {
            "id": str(tc.id),
            "displayId": tc.display_id,
            "title": tc.title,
            "module": tc.module,
            "severity": tc.severity,
            "status": tc.status,
            "type": tc.type,
        }
        for tc in test_cases
    ]


@router.post("/{requirement_id}/test-cases", status_code=status.HTTP_201_CREATED)
def link_test_case(
    requirement_id: uuid.UUID,
    test_case_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    """Link a test case to a requirement."""
    requirement = db.get(Requirement, requirement_id)
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    test_case = db.get(TestCase, test_case_id)
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    # Check if already linked
    existing = db.scalar(
        select(RequirementTestCase)
        .where(
            RequirementTestCase.requirement_id == requirement_id,
            RequirementTestCase.test_case_id == test_case_id,
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="Test case already linked")
    
    link = RequirementTestCase(
        requirement_id=requirement_id,
        test_case_id=test_case_id,
    )
    db.add(link)
    db.commit()
    
    return {"message": "Test case linked successfully"}


@router.delete("/{requirement_id}/test-cases/{test_case_id}")
def unlink_test_case(
    requirement_id: uuid.UUID,
    test_case_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    """Unlink a test case from a requirement."""
    link = db.scalar(
        select(RequirementTestCase)
        .where(
            RequirementTestCase.requirement_id == requirement_id,
            RequirementTestCase.test_case_id == test_case_id,
        )
    )
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    db.delete(link)
    db.commit()
    
    return {"message": "Test case unlinked successfully"}


@router.get("/{requirement_id}/comments", response_model=list[dict])
def get_comments(
    requirement_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    """Get comments for a requirement."""
    requirement = db.get(Requirement, requirement_id)
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    comments = db.scalars(
        select(RequirementComment)
        .where(RequirementComment.requirement_id == requirement_id)
        .order_by(RequirementComment.created_at.desc())
    ).all()
    
    return [
        {
            "id": str(c.id),
            "userId": str(c.user_id),
            "content": c.content,
            "createdAt": c.created_at.isoformat(),
        }
        for c in comments
    ]


@router.post("/{requirement_id}/comments", status_code=status.HTTP_201_CREATED)
def add_comment(
    requirement_id: uuid.UUID,
    content: str,
    user_id: uuid.UUID,
    db: Session = Depends(get_db_session),
) -> Any:
    """Add a comment to a requirement."""
    requirement = db.get(Requirement, requirement_id)
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    comment = RequirementComment(
        requirement_id=requirement_id,
        user_id=user_id,
        content=content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    return {
        "id": str(comment.id),
        "userId": str(comment.user_id),
        "content": comment.content,
        "createdAt": comment.created_at.isoformat(),
    }
