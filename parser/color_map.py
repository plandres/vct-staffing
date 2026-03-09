"""
Color classification for Seven2 VCT staffing slides.
Source: seven2-skills/skills/seven2-slide-reader/SKILL.md lines 51-59
"""

# Cell background colors → workload level
HEAVY_COLORS = {"0E632A", "3C7D22"}
LIGHT_COLORS = {"92D050"}
NO_VCT_COLORS = {"DAE9F8"}

# Text colors → status
STATUS_COLORS = {
    "1CC853": "ongoing",
    "1CC754": "ongoing",
    "FF6600": "to_start",
    "00827D": "completed",
}


def hex_to_workload(hex_str: str | None) -> str:
    """Map a hex color string to workload level."""
    if not hex_str:
        return "unknown"
    normalized = hex_str.upper().replace("#", "").strip()
    if normalized in HEAVY_COLORS:
        return "heavy"
    if normalized in LIGHT_COLORS:
        return "light"
    if normalized in NO_VCT_COLORS:
        return "none"
    return "unknown"


def hex_to_status(hex_str: str | None) -> str:
    """Map a text color hex to assignment status."""
    if not hex_str:
        return "ongoing"
    normalized = hex_str.upper().replace("#", "").strip()
    return STATUS_COLORS.get(normalized, "ongoing")


# VCT member initials → canonical name mapping
INITIALS_MAP = {
    "FC": "Francois Candelon",
    "DA": "Dominica Adam",
    "PLA": "Paul-Louis Andres",
    "AC": "Alain Crozier",
    "SM": "Sandrine Meunier",
    "CA": "Christophe Aulnette",
    "FL": "Franck Lebouchard",
    "CS": "Cedric Sellin",
    "HW": "Hendrik Witt",
    "FB": "Florian Bienvenu",
    "JR": "Jacques Reynaud",
    "RN": "Ron Nicol",
}

# Normalize initials (handle FC2 → FC, etc.)
def normalize_initials(raw: str) -> str:
    """Clean initials: strip digits, whitespace, handle known aliases."""
    cleaned = "".join(c for c in raw.strip() if c.isalpha()).upper()
    return cleaned
