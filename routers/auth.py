from fastapi import Depends, HTTPException, status
from .custom_router import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from fastapi.security import OAuth2PasswordRequestForm
from pwdlib import PasswordHash

import models
import schemas
from database import get_db

from oauth2 import create_access_token

router = APIRouter(tags=["Authentication"])
password_hash = PasswordHash.recommended()


@router.post("/login", response_model=schemas.Token)
async def login(
    user_credentials: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.User).where(
            or_(
                models.User.username == user_credentials.username,
                models.User.email == user_credentials.username.lower()
            )
        )
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Credentials"
        )

    if not password_hash.verify(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Credentials"
        )

    # Generate the JWT token!
    access_token = create_access_token(data={"user_id": user.id})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
