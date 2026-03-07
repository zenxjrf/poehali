"""
Vercel Serverless Function Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Poehali API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Poehali API is running", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    import time
    return {"status": "healthy", "timestamp": time.time()}


@app.get("/api/v1/status")
async def api_status():
    return {"api": "available", "version": "1.0"}
