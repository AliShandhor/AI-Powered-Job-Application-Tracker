from fastapi import FastAPI

app = FastAPI(title="JobTracker AI")

@app.get("/health")
async def health():
    return {"status": "ok"}
