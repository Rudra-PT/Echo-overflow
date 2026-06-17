from fastapi import Depends, HTTPException, status
from .custom_router import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

import models
import schemas
from database import get_db

from oauth2 import get_current_user

router = APIRouter(prefix="/answers", tags=["Answers"])


@router.get("/question/{question_id}", response_model=List[schemas.AnswerResponse])
async def get_answers_for_question(question_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Answer).where(models.Answer.question_id == question_id))
    return result.scalars().all()


@router.post("/question/{question_id}", response_model=schemas.AnswerResponse, status_code=status.HTTP_201_CREATED)
async def create_answer(
    question_id: int,
    answer: schemas.AnswerCreate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    question_result = await db.execute(select(models.Question).where(models.Question.id == question_id))
    if not question_result.scalars().first():
        raise HTTPException(status_code=404, detail="Question not found")

    new_answer = models.Answer(
        **answer.model_dump(),
        user_id=current_user.id,
        question_id=question_id
    )

    db.add(new_answer)
    await db.commit()
    await db.refresh(new_answer)
    return new_answer


@router.patch("/{id}", response_model=schemas.AnswerResponse)
async def update_answer(
    id: int,
    answer_in: schemas.AnswerCreate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Answer).where(models.Answer.id == id))
    answer = result.scalars().first()

    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")

    if answer.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Not authorized to edit this answer")

    answer.content = answer_in.content

    await db.commit()
    await db.refresh(answer)
    return answer


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_answer(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Answer).where(models.Answer.id == id))
    answer = result.scalars().first()

    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")

    if answer.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Not authorized to delete this answer")

    await db.delete(answer)
    await db.commit()
