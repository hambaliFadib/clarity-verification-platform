import uuid
from datetime import datetime, timezone

from sqlalchemy import ARRAY, DateTime, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Defect(Base):
    __tablename__ = "defects"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    display_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(String(10), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Open")
    type: Mapped[str] = mapped_column(String(20), nullable=False, default="Bug")
    priority: Mapped[str] = mapped_column(String(10), nullable=False)
    assigned_to: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reported_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    test_case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("test_cases.id", ondelete="SET NULL"), nullable=True, index=True)
    test_run_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("test_runs.id", ondelete="SET NULL"), nullable=True, index=True)
    
    test_case = relationship("TestCase", back_populates="defects", lazy="selectin")
    test_run = relationship("TestRun", back_populates="defects", lazy="selectin")
    environment: Mapped[str | None] = mapped_column(String(120), nullable=True)
    browser: Mapped[str | None] = mapped_column(String(120), nullable=True)
    steps_to_reproduce: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
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
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    comments = relationship("DefectComment", back_populates="defect", cascade="all, delete-orphan", lazy="selectin")
