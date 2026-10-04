from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .database import Base, engine
from .routes.auth import router as auth_router
from .routes.destinations import router as destinations_router
from .routes.saved_destinations import router as saved_destinations_router
from .routes.trips import router as trips_router
from .routes.profile import router as profile_router
from .routes.safety import router as safety_router
from .routes.translation import router as translation_router
from .routes.assistant import router as assistant_router

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="SmartSafar API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request, exc: RequestValidationError):
    # Never echo rejected values: validation errors may contain plaintext passwords.
    errors = [
        {
            "field": ".".join(str(part) for part in error.get("loc", ())[1:]),
            "message": error.get("msg", "Invalid value."),
        }
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={"detail": "Please correct the highlighted information.", "errors": errors},
    )


@app.get("/")
def home():
    return {"message": "SmartSafar API is running", "status": "success"}


@app.get("/health")
def health():
    return {"status": "healthy"}


app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
app.include_router(destinations_router, prefix="/api", tags=["destinations"])
app.include_router(saved_destinations_router, prefix="/api", tags=["saved destinations"])
app.include_router(trips_router, prefix="/api", tags=["trips and itinerary planning"])
app.include_router(profile_router, prefix="/api", tags=["profile"])
app.include_router(safety_router, prefix="/api", tags=["safety"])
app.include_router(translation_router, prefix="/api", tags=["translation"])
app.include_router(assistant_router, prefix="/api", tags=["AI travel assistant"])
