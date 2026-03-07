"""
Vercel Serverless Function Entry Point - Poehali API
"""
import logging
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Poehali API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Временные данные для serverless
TRIPS_DB = [
    {"id": 1, "direction": "tashkent_fergana", "price": 150000},
    {"id": 2, "direction": "fergana_tashkent", "price": 150000}
]

DRIVERS_DB = [
    {"id": 1, "name": "Алишер", "car_brand": "Chevrolet", "car_model": "Malibu", "car_year": 2022},
    {"id": 2, "name": "Рустам", "car_brand": "Chevrolet", "car_model": "Tracker", "car_year": 2023},
    {"id": 3, "name": "Сардор", "car_brand": "BYD", "car_model": "Han", "car_year": 2024}
]


@app.get("/")
async def root():
    return {"message": "Poehali API is running", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}


@app.get("/api/v1/status")
async def api_status():
    return {"api": "available", "version": "1.0"}


@app.get("/api/drivers")
async def get_drivers():
    return DRIVERS_DB


@app.get("/api/trips")
async def get_trips():
    return TRIPS_DB
