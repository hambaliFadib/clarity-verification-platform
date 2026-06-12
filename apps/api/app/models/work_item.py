import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class WorkItem(Base):
    __tablename__ = "work_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="To Do")
    priority: Mapped[str] = mapped_column(String(10), nullable=False, default="Medium")
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    scope: Mapped[str | None] = mapped_column(String(120), nullable=True)
    assigned_to: Mapped[str] = mapped_column(String(100), nullable=False)
    test_case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("test_cases.id"), nullable=True)
    defect_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("defects.id"), nullable=True)
    due_in: Mapped[str | None] = mapped_column(String(40), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
