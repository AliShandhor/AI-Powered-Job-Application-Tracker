from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.core.models import Application
from app.domains.applications.schemas import ApplicationCreate, ApplicationUpdate
import uuid

class ApplicationRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, user_id: uuid.UUID):
        result = await self.db.execute(
            select(Application).where(Application.user_id == user_id).order_by(Application.created_at.desc())
        )
        return result.scalars().all()

    async def get_by_id(self, id: uuid.UUID, user_id: uuid.UUID):
        result = await self.db.execute(
            select(Application).where(Application.id == id, Application.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: uuid.UUID, data: ApplicationCreate):
        app = Application(user_id=user_id, **data.model_dump())
        self.db.add(app)
        await self.db.flush()
        await self.db.refresh(app)
        return app

    async def update(self, id: uuid.UUID, user_id: uuid.UUID, data: ApplicationUpdate):
        values = {k: v for k, v in data.model_dump().items() if v is not None}
        await self.db.execute(
            update(Application).where(Application.id == id, Application.user_id == user_id).values(**values)
        )
        return await self.get_by_id(id, user_id)

    async def delete(self, id: uuid.UUID, user_id: uuid.UUID):
        await self.db.execute(
            delete(Application).where(Application.id == id, Application.user_id == user_id)
        )