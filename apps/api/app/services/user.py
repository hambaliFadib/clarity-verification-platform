import uuid
from sqlalchemy.orm import Session
from app.models.user import User


def get_users(db: Session) -> list[User]:
    return db.query(User).all()


def seed_users(db: Session) -> None:
    if db.query(User).count() > 0:
        return

    users_data = [
        {
            "id": uuid.UUID("4472c67d-d42f-48d6-9dc4-1be8bc7b71f1"),
            "name": "Hambali Fadib",
            "email": "hambali@nexqa.io",
            "role": "Admin",
            "initials": "HF",
        },
        {
            "id": uuid.UUID("f91ab4c8-356a-464a-9ef8-b184a4bbbc1f"),
            "name": "Sarah Chen",
            "email": "sarah@nexqa.io",
            "role": "QA Lead",
            "initials": "SC",
        },
        {
            "id": uuid.UUID("fae59a91-fa89-4b2a-bf39-399bf033878b"),
            "name": "Marcus Rivera",
            "email": "marcus@nexqa.io",
            "role": "QA Engineer",
            "initials": "MR",
        },
        {
            "id": uuid.UUID("111b1c55-efee-4c28-98f5-b223c72b22bb"),
            "name": "Aiko Tanaka",
            "email": "aiko@nexqa.io",
            "role": "QA Engineer",
            "initials": "AT",
        },
        {
            "id": uuid.UUID("555a6d59-d890-4a87-ad9c-4eeefc8b88d2"),
            "name": "David Park",
            "email": "david@nexqa.io",
            "role": "Developer",
            "initials": "DP",
        },
    ]

    for data in users_data:
        db.add(User(**data))
    db.commit()
