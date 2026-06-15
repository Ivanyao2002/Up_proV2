import os
import tempfile
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR

OCR_LANG = os.getenv("OCR_LANG", "fr")
OCR_PORT = int(os.getenv("PORT", "8866"))
<<<<<<< HEAD
=======
# Préfixe public derrière nginx (ex. https://uat.upjunoo.com/ocr-api/)
ROOT_PATH = os.getenv("ROOT_PATH", "").rstrip("/")
>>>>>>> main

ocr_engine: PaddleOCR | None = None


def get_ocr() -> PaddleOCR:
    global ocr_engine
    if ocr_engine is None:
        ocr_engine = PaddleOCR(
            use_angle_cls=True,
            lang=OCR_LANG,
            use_gpu=False,
            show_log=False,
            cpu_threads=min(4, os.cpu_count() or 4),
        )
    return ocr_engine


def format_ocr_result(raw: Any) -> dict[str, Any]:
    """Normalise la sortie PaddleOCR en JSON simple."""
    if raw is None:
        return {"lines": [], "full_text": ""}

    lines: list[dict[str, Any]] = []
    pages = raw if isinstance(raw, list) else [raw]

    for page in pages:
        if not page:
            continue
        for item in page:
            if not item or len(item) < 2:
                continue
            box, text_info = item[0], item[1]
            text = text_info[0] if isinstance(text_info, (list, tuple)) else str(text_info)
            confidence = float(text_info[1]) if isinstance(text_info, (list, tuple)) and len(text_info) > 1 else None
            lines.append(
                {
                    "text": text,
                    "confidence": confidence,
                    "box": [[float(x), float(y)] for x, y in box],
                }
            )

    return {
        "lines": lines,
        "full_text": "\n".join(line["text"] for line in lines),
        "line_count": len(lines),
    }


@asynccontextmanager
async def lifespan(_: FastAPI):
    get_ocr()
    yield


app = FastAPI(
    title="UpJunoo PaddleOCR API",
    version="1.0.0",
    lifespan=lifespan,
<<<<<<< HEAD
=======
    root_path=ROOT_PATH,
>>>>>>> main
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "engine": "paddleocr", "lang": OCR_LANG}


<<<<<<< HEAD
=======
def public_path(path: str) -> str:
    return f"{ROOT_PATH}{path}" if ROOT_PATH else path


>>>>>>> main
@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "paddleocr-api",
<<<<<<< HEAD
        "docs": "/docs",
        "health": "/health",
        "ocr": "POST /ocr (multipart file)",
=======
        "docs": public_path("/docs"),
        "health": public_path("/health"),
        "ocr": f"POST {public_path('/ocr')} (multipart file)",
>>>>>>> main
    }


@app.post("/ocr")
async def ocr_image(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Fichier image requis (image/png, image/jpeg, …)")

    suffix = os.path.splitext(file.filename or "upload.png")[1] or ".png"
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Fichier vide")

    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(data)
            tmp_path = tmp.name

        raw = get_ocr().ocr(tmp_path, cls=True)
        return format_ocr_result(raw)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur OCR: {exc}") from exc
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
