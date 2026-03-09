"""
PDF parser for Seven2 RDQM documents.
Best-effort extraction: text only, no color classification.
Used for extracting strategic priorities and notes, NOT staffing assignments.
"""

import fitz  # PyMuPDF
import re


def parse_rdqm_pdf(file_path: str) -> dict:
    """
    Parse a Seven2 RDQM PDF and extract text content.
    Best-effort: extracts structured text blocks, priorities, and notes.
    Does NOT extract staffing assignments (no color data in PDF).

    Returns:
        {
            "pages": [{"page": 1, "text": "..."}, ...],
            "priorities_found": [
                {"company": "...", "priorities": ["...", "..."]},
                ...
            ],
            "warnings": ["PDF parsing is best-effort..."],
            "page_count": N
        }
    """
    doc = fitz.open(file_path)
    pages = []
    priorities_found = []
    warnings = [
        "PDF parsing is best-effort. Staffing assignments (workload levels) "
        "can only be reliably extracted from PPTX files. "
        "This extraction covers text content, priorities, and notes only."
    ]

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        pages.append({"page": page_num + 1, "text": text})

        # Try to extract priorities from structured text blocks
        # Look for patterns like "Priority:" or "Strategic priorities:"
        priority_matches = re.findall(
            r"(?:priorit[yies]+|strategic|objecti[fves]+)[:\s]+(.+?)(?:\n\n|\Z)",
            text,
            re.IGNORECASE | re.DOTALL,
        )
        if priority_matches:
            for match in priority_matches:
                items = [
                    line.strip("- \u2022\u2023\u25e6")
                    for line in match.strip().split("\n")
                    if line.strip()
                ]
                if items:
                    priorities_found.append(
                        {"page": page_num + 1, "priorities": items}
                    )

    doc.close()

    return {
        "pages": pages,
        "priorities_found": priorities_found,
        "warnings": warnings,
        "page_count": len(pages),
    }
