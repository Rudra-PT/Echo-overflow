from fastapi import Depends, HTTPException, status
from .custom_router import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pwdlib import PasswordHash

import models
import schemas
from database import get_db

from oauth2 import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])
password_hash = PasswordHash.recommended()


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.UserResponse)
async def create_user(user_in: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.User).where(
            (models.User.username == user_in.username) |
            (models.User.email == user_in.email.lower())
        )
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=400, detail="Username or email already registered")

    new_user = models.User(
        username=user_in.username,
        email=user_in.email.lower(),
        password=password_hash.hash(user_in.password)
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.get("/{user_id}", response_model=schemas.UserResponse)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="user not found")
    return user


@router.patch("/{user_id}", response_model=schemas.UserResponse)
async def user_update(
    user_id: int,
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="user not found")

    update_data = user_in.model_dump(exclude_unset=True)

    if "username" in update_data:
        user.username = update_data["username"]
    if "email" in update_data:
        user.email = update_data["email"].lower()
    if "password" in update_data:
        user.password = password_hash.hash(update_data["password"])

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def user_delete(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    await db.delete(user)
    await db.commit()
