from app.db.session import get_engine
from sqlalchemy import text

with get_engine().connect() as conn:
    print(conn.execute(text("SELECT * FROM alembic_version")).fetchall())
