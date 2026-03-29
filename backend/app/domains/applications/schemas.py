from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
import uuid

class ApplicationCreate(BaseModel):
    company_name: str
    job_title: str
    status: str = 'applied'
    applied_date: date
    job_description: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None

class ApplicationUpdate(BaseModel):
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    status: Optional[str] = None
    job_description: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None

class ApplicationOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    company_name: str
    job_title: str
    status: str
    applied_date: date
    job_description: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    ai_match_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = {'from_attributes': True}