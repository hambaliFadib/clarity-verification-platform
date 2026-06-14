import uuid
from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from app.models.requirement import (
    Requirement,
    RequirementVersion,
    RequirementTestCase,
    RequirementComment,
    RequirementTag,
)
from app.models.test_case import TestCase
from app.models.defect import Defect


def get_requirements_with_filters(
    db: Session,
    status: str | None = None,
    module: str | None = None,
    type: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Requirement], int]:
    """Get requirements with optional filters. Returns (items, total)."""
    query = select(Requirement)
    
    if status:
        query = query.where(Requirement.status == status)
    if module:
        query = query.where(Requirement.module == module)
    if type:
        query = query.where(Requirement.type == type)
    if priority:
        query = query.where(Requirement.priority == priority)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            Requirement.title.ilike(search_pattern)
            | Requirement.display_id.ilike(search_pattern)
            | Requirement.module.ilike(search_pattern)
        )
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = db.scalar(count_query) or 0
    
    # Get items
    items = db.scalars(
        query.order_by(Requirement.created_at.desc()).offset(skip).limit(limit)
    ).all()
    
    return list(items), total


def get_requirement_with_relations(
    db: Session, 
    requirement_id: uuid.UUID
) -> Requirement | None:
    """Get requirement with test_cases, comments, and versions."""
    query = (
        select(Requirement)
        .options(
            selectinload(Requirement.test_case_links),
            selectinload(Requirement.comments),
            selectinload(Requirement.versions),
        )
        .where(Requirement.id == requirement_id)
    )
    return db.scalar(query)


def create_requirement_with_validation(
    db: Session,
    title: str,
    module: str,
    type: str,
    priority: str,
    description: str | None = None,
    acceptance_criteria: str | None = None,
    business_rules: str | None = None,
    created_by_id: uuid.UUID | None = None,
    project_id: uuid.UUID | None = None,
) -> Requirement:
    """Create a new requirement with validation."""
    # Generate display_id
    count = db.scalar(select(func.count(Requirement.id))) or 0
    display_id = f"REQ-{(count + 1):03d}"
    
    requirement = Requirement(
        display_id=display_id,
        title=title,
        module=module,
        type=type,
        priority=priority,
        status="Draft",
        description=description,
        acceptance_criteria=acceptance_criteria,
        business_rules=business_rules,
        created_by_id=created_by_id,
        project_id=project_id,
    )
    
    db.add(requirement)
    db.commit()
    db.refresh(requirement)
    return requirement


def update_requirement_with_versioning(
    db: Session,
    requirement_id: uuid.UUID,
    updates: dict,
    changed_by_id: uuid.UUID | None = None,
) -> Requirement | None:
    """Update requirement and create version record."""
    requirement = db.get(Requirement, requirement_id)
    if not requirement:
        return None
    
    # Store old values for versioning
    old_values = {}
    for key, value in updates.items():
        old_value = getattr(requirement, key, None)
        if old_value != value:
            old_values[key] = old_value
    
    # Update fields
    for key, value in updates.items():
        setattr(requirement, key, value)
    
    # Create version record if there are changes
    if old_values:
        # Get latest version number
        latest_version = db.scalar(
            select(func.max(RequirementVersion.version_number))
            .where(RequirementVersion.requirement_id == requirement_id)
        ) or 0
        
        if changed_by_id:
            version = RequirementVersion(
                requirement_id=requirement_id,
                version_number=latest_version + 1,
                changes_json={
                    "old": old_values,
                    "new": {k: v for k, v in updates.items() if k in old_values},
                },
                changed_by_id=changed_by_id,
            )
            db.add(version)
    
    db.commit()
    db.refresh(requirement)
    return requirement


def link_test_case_to_requirement(
    db: Session,
    requirement_id: uuid.UUID,
    test_case_id: uuid.UUID,
) -> bool:
    """Link a test case to a requirement."""
    # Check if link already exists
    existing = db.scalar(
        select(RequirementTestCase)
        .where(
            RequirementTestCase.requirement_id == requirement_id,
            RequirementTestCase.test_case_id == test_case_id,
        )
    )
    if existing:
        return False
    
    link = RequirementTestCase(
        requirement_id=requirement_id,
        test_case_id=test_case_id,
    )
    db.add(link)
    db.commit()
    return True


def unlink_test_case_from_requirement(
    db: Session,
    requirement_id: uuid.UUID,
    test_case_id: uuid.UUID,
) -> bool:
    """Unlink a test case from a requirement."""
    link = db.scalar(
        select(RequirementTestCase)
        .where(
            RequirementTestCase.requirement_id == requirement_id,
            RequirementTestCase.test_case_id == test_case_id,
        )
    )
    if not link:
        return False
    
    db.delete(link)
    db.commit()
    return True


def add_requirement_comment(
    db: Session,
    requirement_id: uuid.UUID,
    user_id: uuid.UUID,
    content: str,
) -> RequirementComment:
    """Add a comment to a requirement."""
    comment = RequirementComment(
        requirement_id=requirement_id,
        user_id=user_id,
        content=content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def get_requirement_comments(
    db: Session,
    requirement_id: uuid.UUID,
) -> list[RequirementComment]:
    """Get all comments for a requirement."""
    return list(
        db.scalars(
            select(RequirementComment)
            .where(RequirementComment.requirement_id == requirement_id)
            .order_by(RequirementComment.created_at.desc())
        ).all()
    )


def get_requirement_version_history(
    db: Session,
    requirement_id: uuid.UUID,
) -> list[RequirementVersion]:
    """Get all versions for a requirement."""
    return list(
        db.scalars(
            select(RequirementVersion)
            .where(RequirementVersion.requirement_id == requirement_id)
            .order_by(RequirementVersion.version_number.desc())
        ).all()
    )


def get_traceability_matrix(
    db: Session,
    project_id: uuid.UUID | None = None,
) -> list[dict]:
    """Get requirements with linked test cases and defects."""
    query = select(Requirement)
    if project_id:
        query = query.where(Requirement.project_id == project_id)
    
    requirements = db.scalars(query).all()
    
    result = []
    for req in requirements:
        # Get linked test cases
        linked_tcs = db.scalars(
            select(TestCase)
            .join(RequirementTestCase)
            .where(RequirementTestCase.requirement_id == req.id)
        ).all()
        
        # Get defects linked to those test cases
        tc_display_ids = [tc.display_id for tc in linked_tcs]
        linked_defects = []
        if tc_display_ids:
            linked_defects = list(
                db.scalars(
                    select(Defect)
                    .where(Defect.linked_test_case.in_(tc_display_ids))
                ).all()
            )
        
        # Calculate coverage
        total_tcs = len(linked_tcs)
        passed_tcs = len([tc for tc in linked_tcs if tc.status == "Approved"])
        coverage = (passed_tcs / total_tcs * 100) if total_tcs > 0 else 0
        
        result.append({
            "requirement": req,
            "test_cases": linked_tcs,
            "defects": linked_defects,
            "coverage": coverage,
            "total_test_cases": total_tcs,
            "passed_test_cases": passed_tcs,
        })
    
    return result


def get_requirement_statistics(
    db: Session,
    project_id: uuid.UUID | None = None,
) -> dict:
    """Get requirement statistics."""
    query = select(Requirement)
    if project_id:
        query = query.where(Requirement.project_id == project_id)
    
    requirements = db.scalars(query).all()
    
    stats = {
        "total": len(requirements),
        "by_status": {},
        "by_priority": {},
        "by_module": {},
        "by_type": {},
    }
    
    for req in requirements:
        stats["by_status"][req.status] = stats["by_status"].get(req.status, 0) + 1
        stats["by_priority"][req.priority] = stats["by_priority"].get(req.priority, 0) + 1
        stats["by_module"][req.module] = stats["by_module"].get(req.module, 0) + 1
        stats["by_type"][req.type] = stats["by_type"].get(req.type, 0) + 1
    
    return stats
