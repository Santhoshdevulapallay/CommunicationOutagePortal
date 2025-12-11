from sqlalchemy import create_engine

ctx = None
def get_db_engine(POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_DB):

    global ctx
    if ctx is None:
        db_url = f"postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}/{POSTGRES_DB}"
        ctx = create_engine(db_url, echo=False, pool_pre_ping=True)

    return ctx