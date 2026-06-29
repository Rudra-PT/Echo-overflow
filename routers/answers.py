import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from .custom_router import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from jose import jwt, JWTError

import models
import schemas
from database import get_db
from oauth2 import get_current_user

oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

router = APIRouter(prefix="/answers", tags=["Answers"])


def _decode_user_id(token: Optional[str]) -> Optional[int]:
    if not token:
        return None
    try:
        payload = jwt.decode(
            token,
            os.getenv("SECRET_KEY", ""),
            algorithms=[os.getenv("ALGORITHM", "HS256")]
        )
        uid = payload.get("user_id")
        return int(uid) if uid is not None else None
    except (JWTError, Exception):
        return None


@router.get("/question/{question_id}", response_model=List[schemas.AnswerWithVotes])
async def get_answers_for_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme_optional),
):
    current_user_id = _decode_user_id(token)

    result = await db.execute(
        select(models.Answer).where(models.Answer.question_id == question_id)
    )
    answers = result.scalars().all()

    enriched: List[schemas.AnswerWithVotes] = []
    for answer in answers:
        votes_result = await db.execute(
            select(func.coalesce(func.sum(models.Vote.vote_value), 0)).where(
                models.Vote.answer_id == answer.id
            )
        )
        vote_score = votes_result.scalar() or 0

        author_result = await db.execute(
            select(models.User).where(models.User.id == answer.user_id)
        )
        author = author_result.scalars().first()
        author_username = author.username if author else f"User #{answer.user_id}"
        author_reputation = author.reputation if author else 0

        my_vote = 0
        if current_user_id is not None:
            my_vote_result = await db.execute(
                select(models.Vote).where(
                    models.Vote.answer_id == answer.id,
                    models.Vote.user_id == current_user_id,
                )
            )
            existing = my_vote_result.scalars().first()
            my_vote = existing.vote_value if existing else 0

        enriched.append(
            schemas.AnswerWithVotes(
                id=answer.id,
                content=answer.content,
                user_id=answer.user_id,
                question_id=answer.question_id,
                created_at=answer.created_at,
                is_ai_generated=answer.is_ai_generated,
                vote_score=vote_score,
                author_username=author_username,
                author_reputation=author_reputation,
                my_vote=my_vote,
            )
        )

    return enriched


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
