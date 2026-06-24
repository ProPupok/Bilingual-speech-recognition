from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.src.database import engine, Base
from backend.src.routers import audio

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bilingual Speech Backend API")

origins = [
    "https://localhost:3000",       # Если фронтенд на React/Next.js локально
    "https://192.168.56.1:5173",    # Если фронтенд открыт по локальному IP
    "https://10.93.26.206:5173",    # Если фронтенд открыт по локальному IP
    "https://localhost:5173",       # Если используется Vite
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Используем явный список доменов
    allow_credentials=True, # Оставляем True
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audio.router)
