"""Local diagnostic helper for approval-gate entity IDs.

Run only against local/dev databases:

  ALLOW_LOCAL_ENTITY_DIAGNOSTIC=1 ENVIRONMENT=local python apps/api/get_entities.py
"""

import os

from sqlalchemy import text

from app.db.session import get_engine


def require_local_diagnostic_enabled() -> None:
    environment = os.getenv("ENVIRONMENT", "local").lower()
    enabled = os.getenv("ALLOW_LOCAL_ENTITY_DIAGNOSTIC", "").lower() in {"1", "true", "yes"}
    if environment not in {"local", "dev", "development"} or not enabled:
        raise SystemExit(
            "Refusing to inspect entities. Set ALLOW_LOCAL_ENTITY_DIAGNOSTIC=1 "
            "and ENVIRONMENT=local/dev/development."
        )


def main() -> None:
    require_local_diagnostic_enabled()
    with get_engine().connect() as conn:
        requirements = conn.execute(text("select id, title from requirements limit 3")).fetchall()
        users = conn.execute(text("select id, email from users limit 3")).fetchall()
        print({"requirements": requirements, "users": users})


if __name__ == "__main__":
    main()
