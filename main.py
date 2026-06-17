from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, base
import models
from routers import users, questions, auth, answers, votes


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(base.metadata.create_all)

    yield


app = FastAPI(
    title="Echo Overflow API",
    description="The backend engine for a modern Q&A platform.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(questions.router)
app.include_router(answers.router)
app.include_router(votes.router)


@app.get("/")
async def root():
    return {"status": "Online", "message": "Echo Overflow API Engine is running."}
