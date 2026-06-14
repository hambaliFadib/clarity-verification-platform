from sqlalchemy import text
from app.db.session import get_engine

engine = get_engine()
with engine.connect() as conn:
    result = conn.execute(text('SELECT * FROM alembic_version')).fetchall()
    print("Alembic Versions in DB:", result)
    print("No changes were applied. Run Alembic migrations instead of editing alembic_version manually.")
