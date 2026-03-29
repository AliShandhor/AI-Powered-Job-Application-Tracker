from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import json
from app.core.config import settings

router = APIRouter(prefix='/api/v1/ai', tags=['ai'])
client = OpenAI(api_key=settings.OPENAI_API_KEY)

class AnalyzeRequest(BaseModel):
    job_description: str

@router.post('/analyze-job')
async def analyze_job(req: AnalyzeRequest):
    if not req.job_description or len(req.job_description) < 50:
        raise HTTPException(status_code=400, detail='Job description too short')
    response = client.chat.completions.create(
        model='gpt-4o-mini',
        response_format={'type': 'json_object'},
        messages=[
            {'role': 'system', 'content': 'You are a job description analyzer. Extract structured data and return JSON with keys: required_skills (list), preferred_skills (list), seniority_level (junior/mid/senior/staff/principal), estimated_yoe (int), key_requirements (list of 5 strings), culture_signals (list), compensation (object with min/max/currency or null). Return only valid JSON.'},
            {'role': 'user', 'content': req.job_description}
        ],
        temperature=0.1,
        max_tokens=800,
    )
    return json.loads(response.choices[0].message.content)