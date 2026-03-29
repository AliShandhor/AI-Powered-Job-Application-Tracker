from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from app.core.database import get_db_session
from app.core.models import Note
import uuid
from datetime import datetime

router = APIRouter(prefix='/api/v1/applications', tags=['notes'])

class NoteCreate(BaseModel):
    content: str

class NoteOut(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    content: str
    created_at: datetime

    model_config = {'from_attributes': True}

@router.get('/{app_id}/notes', response_model=list[NoteOut])
async def list_notes(
    app_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(
        select(Note)
        .where(Note.application_id == app_id)
        .order_by(Note.created_at.desc())
    )
    return result.scalars().all()

@router.post('/{app_id}/notes', response_model=NoteOut)
async def create_note(
    app_id: uuid.UUID,
    data: NoteCreate,
    db: AsyncSession = Depends(get_db_session),
):
    note = Note(application_id=app_id, content=data.content)
    db.add(note)
    await db.flush()
    await db.refresh(note)
    return note

@router.delete('/{app_id}/notes/{note_id}')
async def delete_note(
    app_id: uuid.UUID,
    note_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
):
    await db.execute(
        delete(Note).where(Note.id == note_id, Note.application_id == app_id)
    )
    return {'ok': True}