from fastapi import FastAPI
from .routes import chat, model_ops, system
from .database.db import engine
from .models.chat_models import Base
from .database.db import engine
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(lifespan=lifespan)

# Allow React frontend on localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update if using different port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Include routers
app.include_router(system.router)
app.include_router(model_ops.router, prefix="/model")
app.include_router(chat.router, prefix="/chat")



# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development server
        "http://127.0.0.1:3000",
        "http://localhost:3001",  # Alternative port
        "file://",  # For Electron app
        "*"  # Remove this in production, specify exact origins
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# # Optional: Serve React build files (for production)
# if os.path.exists("build"):
#     app.mount("/static", StaticFiles(directory="build/static"), name="static")
    
#     @app.get("/")
#     async def serve_react_app():
#         return FileResponse("build/index.html")

