from fastapi import Depends, HTTPException, status
from .custom_router import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import models
import schemas
from database import get_db
from oauth2 import get_current_user

router = APIRouter(prefix="/vote", tags=["Vote"])

REP_DELTA = {1: 5, -1: -2}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def vote(
    vote: schemas.VoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    answer_result = await db.execute(
        select(models.Answer).where(models.Answer.id == vote.answer_id)
    )
    answer = answer_result.scalars().first()
    if not answer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Answer not found")

    if answer.user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You cannot vote on your own answer")

    author_result = await db.execute(
        select(models.User).where(models.User.id == answer.user_id)
    )
    author = author_result.scalars().first()

    existing_result = await db.execute(
        select(models.Vote).where(
            models.Vote.answer_id == vote.answer_id,
            models.Vote.user_id == current_user.id,
        )
    )
    existing_vote = existing_result.scalars().first()

    if vote.dir == 0:
        if not existing_vote:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="No vote to remove")
        if author:
            author.reputation -= REP_DELTA[existing_vote.vote_value]
        await db.delete(existing_vote)
        await db.commit()
        return {"message": "Vote removed"}

    if existing_vote:
        if existing_vote.vote_value == vote.dir:
            if author:
                author.reputation -= REP_DELTA[existing_vote.vote_value]
            await db.delete(existing_vote)
            await db.commit()
            return {"message": "Vote removed (toggled off)"}

        if author:
            author.reputation -= REP_DELTA[existing_vote.vote_value]
            author.reputation += REP_DELTA[vote.dir]
        existing_vote.vote_value = vote.dir
        await db.commit()
        return {"message": "Vote updated", "new_dir": vote.dir}

    new_vote = models.Vote(
        answer_id=vote.answer_id,
        user_id=current_user.id,
        vote_value=vote.dir,
    )
    db.add(new_vote)
    if author:
        author.reputation += REP_DELTA[vote.dir]
    await db.commit()
    return {"message": "Vote cast", "dir": vote.dir}
