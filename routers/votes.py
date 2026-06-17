from fastapi import Depends, HTTPException, status
from .custom_router import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import models
import schemas
from database import get_db
from oauth2 import get_current_user

router = APIRouter(prefix="/vote", tags=["Vote"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def vote(
    vote: schemas.VoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = await db.execute(select(models.Answer).where(models.Answer.id == vote.answer_id))
    answer = result.scalars().first()

    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Answer not found")

    vote_query = select(models.Vote).where(
        models.Vote.answer_id == vote.answer_id,
        models.Vote.user_id == current_user.id
    )
    found_vote_result = await db.execute(vote_query)
    found_vote = found_vote_result.scalars().first()

    if vote.dir == 1:
        if found_vote:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"User {current_user.id} has already voted on answer {vote.answer_id}"
            )
        new_vote = models.Vote(answer_id=vote.answer_id,
                               user_id=current_user.id)
        db.add(new_vote)
        await db.commit()
        return {"message": "Successfully added vote"}

    else:
        if not found_vote:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vote does not exist"
            )
        await db.delete(found_vote)
        await db.commit()
        return {"message": "Successfully deleted vote"}
