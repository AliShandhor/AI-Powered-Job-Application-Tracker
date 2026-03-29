from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.domains.applications.repo import ApplicationRepo
from app.domains.applications.schemas import ApplicationCreate, ApplicationUpdate, ApplicationOut
from typing import List
import uuid

router = APIRouter(prefix='/api/v1/applications', tags=['applications'])


async def get_temp_user_id():
    return uuid.UUID('00000000-0000-0000-0000-000000000001')


@router.get('/', response_model=List[ApplicationOut])
async def list_applications(
    db: AsyncSession = Depends(get_db_session),
    user_id: uuid.UUID = Depends(get_temp_user_id)
):
    repo = ApplicationRepo(db)
    return await repo.get_all(user_id)


@router.post('/', response_model=ApplicationOut)
async def create_application(
    data: ApplicationCreate,
    db: AsyncSession = Depends(get_db_session),
    user_id: uuid.UUID = Depends(get_temp_user_id)
):
    repo = ApplicationRepo(db)
    return await repo.create(user_id, data)


@router.get('/{id}', response_model=ApplicationOut)
async def get_application(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    user_id: uuid.UUID = Depends(get_temp_user_id)
):
    repo = ApplicationRepo(db)
    app = await repo.get_by_id(id, user_id)
    if not app:
        raise HTTPException(status_code=404, detail='Application not found')
    return app


@router.patch('/{id}', response_model=ApplicationOut)
async def update_application(
    id: uuid.UUID,
    data: ApplicationUpdate,
    db: AsyncSession = Depends(get_db_session),
    user_id: uuid.UUID = Depends(get_temp_user_id)
):
    repo = ApplicationRepo(db)
    app = await repo.update(id, user_id, data)
    if not app:
        raise HTTPException(status_code=404, detail='Application not found')
    return app


@router.delete('/{id}')
async def delete_application(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    user_id: uuid.UUID = Depends(get_temp_user_id)
):
    repo = ApplicationRepo(db)
    await repo.delete(id, user_id)
    return {'ok': True}