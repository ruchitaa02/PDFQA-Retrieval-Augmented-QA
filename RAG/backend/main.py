import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'

import contextlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.upload import router as upload_router
from api.chat import router as chat_router
import uvicorn

from rag.clip_model import load_model
from rag.vector_store import load_or_create_index

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up Multimodal RAG Backend...")
    # Initialize models and connections
    load_model()
    load_or_create_index()
    print("Startup complete.")
    yield
    print("Shutting down...")

app = FastAPI(title="Multimodal RAG API", lifespan=lifespan)

# Setup CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload_router, tags=["Upload"])
app.include_router(chat_router, tags=["Chat"])

@app.get("/")
async def root():
    return {"message": "Multimodal RAG Backend API is running."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, timeout_keep_alive=600)
