from fastapi import FastAPI

from tbo_inventory.config import settings

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Multi-supplier travel inventory intelligence API.",
)


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "status": "running",
        "version": "0.1.0",
    }


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}
