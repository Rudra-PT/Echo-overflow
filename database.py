from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./echo_overflow.db"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)


AsyncSessionLocal = async_sessionmaker(
    autocommit=False, autoflush=False, bind=engine)

base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
