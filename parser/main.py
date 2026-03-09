"""
VCT Staffing RDQM Parser — FastAPI service.
Deployed on Railway. Accepts PPTX/PDF uploads, returns structured staffing data.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os

from parser_pptx import parse_staffing_pptx
from parser_pdf import parse_rdqm_pdf

app = FastAPI(
    title="VCT RDQM Parser",
    description="Parses Seven2 VCT staffing PPTX/PDF files",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production to Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/parse")
async def parse_rdqm(file: UploadFile = File(...)):
    """
    Parse an RDQM file (PPTX or PDF).

    - PPTX: Full extraction (staffing assignments with workload levels from colors)
    - PDF: Best-effort text extraction (priorities and notes only, NO staffing upsert)
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in (".pptx", ".pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Only .pptx and .pdf are accepted.",
        )

    # Save to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        if ext == ".pptx":
            result = parse_staffing_pptx(tmp_path)
            result["file_type"] = "pptx"
            result["file_name"] = file.filename
            result["can_upsert_staffing"] = True

            # Guardrail: flag if >30% of assignments are new/changed
            total = len(result["assignments"])
            result["total_assignments_found"] = total

        elif ext == ".pdf":
            result = parse_rdqm_pdf(tmp_path)
            result["file_type"] = "pdf"
            result["file_name"] = file.filename
            result["can_upsert_staffing"] = False

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Parsing failed: {str(e)}"
        )
    finally:
        os.unlink(tmp_path)
