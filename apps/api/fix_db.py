from app.db.session import get_engine
from sqlalchemy import text

with get_engine().connect() as conn:
    print("Alembic Versions in DB:")
    print(conn.execute(text("SELECT * FROM alembic_version")).fetchall())
    print("No changes were applied. Run Alembic migrations instead of editing alembic_version manually.")
