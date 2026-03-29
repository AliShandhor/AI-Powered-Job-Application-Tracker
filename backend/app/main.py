from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.domains.applications.router import router as applications_router
from app.domains.ai.router import router as ai_router

def create_app() -> FastAPI:
    app = FastAPI(title='JobTracker AI', version='1.0.0', docs_url='/api/docs')
    app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
    app.include_router(applications_router)
    app.include_router(ai_router)

    @app.get('/health')
    async def health():
        return {'status': 'ok'}

    return app

app = create_app()