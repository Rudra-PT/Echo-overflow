from fastapi import Depends, HTTPException, status
from .custom_router import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import models
import schemas
from database import get_db

from oauth2 import get_current_user

router = APIRouter(prefix="/questions", tags=["Questions"])


@router.get("/", response_model=list[schemas.QuestionResponse])
async def get_all_questions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Question))
    return result.scalars().all()


@router.post("/", response_model=schemas.QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    question: schemas.QuestionCreate,
    current_user: models.User = Depends(
        get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_question = models.Question(
        **question.model_dump(), user_id=current_user.id)
    db.add(new_question)
    await db.commit()
    await db.refresh(new_question)
    return new_question


@router.get("/{id}", response_model=schemas.QuestionResponse)
async def get_question(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Question).where(models.Question.id == id))
    question = result.scalars().first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.patch("/{id}", response_model=schemas.QuestionResponse)
async def update_question(
    id: int,
    question_in: schemas.QuestionCreate,
    current_user: models.User = Depends(
        get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Question).where(models.Question.id == id))
    question = result.scalars().first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if question.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    question.title = question_in.title
    question.content = question_in.content

    await db.commit()
    await db.refresh(question)
    return question


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    id: int,
    current_user: models.User = Depends(
        get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Question).where(models.Question.id == id))
    question = result.scalars().first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if question.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    await db.delete(question)
    await db.commit()
