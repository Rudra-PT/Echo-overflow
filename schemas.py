from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr = Field(max_length=100)
    username: str = Field(min_length=1, max_length=50)
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    reputation: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None


class QuestionCreate(BaseModel):
    title: str
    content: str


class QuestionResponse(BaseModel):
    id: int
    title: str
    content: str
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AnswerCreate(BaseModel):
    content: str


class AnswerResponse(BaseModel):
    id: int
    content: str
    user_id: int
    question_id: int
    created_at: datetime
    is_ai_generated: bool
    model_config = ConfigDict(from_attributes=True)


class AnswerWithVotes(BaseModel):
    id: int
    content: str
    user_id: int
    question_id: int
    created_at: datetime
    is_ai_generated: bool
    vote_score: int
    author_username: str
    author_reputation: int
    my_vote: int
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


class VoteCreate(BaseModel):
    answer_id: int
    dir: int = Field(description="1 = upvote, -1 = downvote, 0 = remove vote")

    @field_validator("dir")
    @classmethod
    def validate_dir(cls, v: int) -> int:
        if v not in (-1, 0, 1):
            raise ValueError("dir must be -1, 0, or 1")
        return v

    model_config = ConfigDict(json_schema_extra={"example": {"answer_id": 1, "dir": 1}})


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)
