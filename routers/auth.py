import os
from datetime import timedelta

from fastapi import Depends, HTTPException, status
from jose import jwt, JWTError
from .custom_router import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from fastapi.security import OAuth2PasswordRequestForm
from pwdlib import PasswordHash

import models
import schemas
from database import get_db

from oauth2 import create_access_token, SECRET_KEY, ALGORITHM

router = APIRouter(tags=["Authentication"])
password_hash = PasswordHash.recommended()

# Lifetime for password-reset tokens (shorter than normal access tokens)
RESET_TOKEN_EXPIRE_MINUTES = 15
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")


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


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    body: schemas.ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Accept an email address and – if a matching account exists – print a
    simulated password-reset link to the terminal.  Always returns the same
    generic message so callers cannot enumerate registered emails.
    """
    result = await db.execute(
        select(models.User).where(models.User.email == body.email.lower())
    )
    user = result.scalars().first()

    if user:
        # Build a short-lived reset token that carries the user's email.
        reset_token = create_access_token(
            data={"sub": "password-reset", "email": user.email},
            expires_delta=timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
        )
        reset_link = f"{FRONTEND_BASE_URL}/reset-password?token={reset_token}"

        # ── Simulated email: printed to the terminal ──────────────────────────
        print("\n" + "=" * 60)
        print("  📧  PASSWORD RESET (simulated – no real email sent)")
        print("=" * 60)
        print(f"  To   : {user.email}")
        print(f"  User : {user.username}")
        print(f"  Link : {reset_link}")
        print(f"  TTL  : {RESET_TOKEN_EXPIRE_MINUTES} minutes")
        print("=" * 60 + "\n")

    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    body: schemas.ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify the password-reset JWT, hash the new password, and update the
    database record.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid or expired reset token.",
    )

    try:
        payload = jwt.decode(body.token, SECRET_KEY, algorithms=[ALGORITHM])

        # Guard: this token must be a password-reset token, not a login token.
        if payload.get("sub") != "password-reset":
            raise credentials_exception

        email: str = payload.get("email")
        if not email:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    result = await db.execute(
        select(models.User).where(models.User.email == email)
    )
    user = result.scalars().first()

    if user is None:
        raise credentials_exception

    # Hash the new password and persist it.
    user.password = password_hash.hash(body.new_password)
    await db.commit()

    return {"message": "Password updated successfully. You can now log in with your new password."}
