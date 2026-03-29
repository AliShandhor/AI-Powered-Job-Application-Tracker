from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import json
from app.core.config import settings

router = APIRouter(prefix='/api/v1/ai', tags=['ai'])
client = OpenAI(api_key=settings.OPENAI_API_KEY)

class AnalyzeRequest(BaseModel):
    job_description: str

class CoverLetterRequest(BaseModel):
    job_description: str
    company_name: str
    job_title: str
    your_background: str
    tone: str = 'professional'

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

@router.post('/cover-letter')
async def generate_cover_letter(req: CoverLetterRequest):
    if not req.job_description or len(req.job_description) < 50:
        raise HTTPException(status_code=400, detail='Job description too short')
    if not req.your_background or len(req.your_background) < 30:
        raise HTTPException(status_code=400, detail='Background too short')

    tone_map = {
        'professional': 'formal and professional tone',
        'conversational': 'warm and conversational tone',
        'startup': 'energetic startup tone, concise and direct',
    }
    tone_str = tone_map.get(req.tone, 'formal and professional tone')

    prompt = f"""Job Title: {req.job_title}
Company: {req.company_name}

Job Description:
{req.job_description}

My Background:
{req.your_background}

Write the cover letter now."""

    response = client.chat.completions.create(
        model='gpt-4o',
        messages=[
            {
                'role': 'system',
                'content': f'You are an expert cover letter writer. Write a compelling tailored cover letter. NEVER use cliches like I am excited to apply. Be specific, reference actual job requirements. Keep it to 3 paragraphs max. Tone: {tone_str}. Start directly with a strong opening sentence. Do NOT include placeholders like [Your Name].'
            },
            {
                'role': 'user',
                'content': prompt
            }
        ],
        temperature=0.7,
        max_tokens=600,
    )
    return {'cover_letter': response.choices[0].message.content}

class InterviewPrepRequest(BaseModel):
    job_description: str
    company_name: str
    job_title: str
    your_background: str = ''

@router.post('/interview-prep')
async def generate_interview_prep(req: InterviewPrepRequest):
    if not req.job_description or len(req.job_description) < 30:
        raise HTTPException(status_code=400, detail='Job description too short')

    response = client.chat.completions.create(
        model='gpt-4o',
        response_format={'type': 'json_object'},
        messages=[
            {
                'role': 'system',
                'content': '''You are an expert interview coach. Generate interview preparation material and return JSON with these exact keys:
- behavioral: list of 5 objects with "question" and "tip" keys (STAR-method behavioral questions)
- technical: list of 5 objects with "question" and "hint" keys (role-specific technical questions)  
- to_ask: list of 3 strings (smart questions the candidate should ask the interviewer)
- red_flags: list of 3 strings (things to watch out for based on the job description)
Return only valid JSON.'''
            },
            {
                'role': 'user',
                'content': f'''Job Title: {req.job_title}
Company: {req.company_name}
Job Description: {req.job_description}
My Background: {req.your_background or "Not provided"}

Generate comprehensive interview prep material.'''
            }
        ],
        temperature=0.7,
        max_tokens=1500,
    )
    return json.loads(response.choices[0].message.content)