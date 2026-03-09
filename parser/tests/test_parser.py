"""
Tests for the VCT RDQM parser.
Run with: pytest tests/test_parser.py -v
"""

import os
import sys
import pytest

# Add parent dir to path so we can import parser modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from color_map import (
    hex_to_workload,
    hex_to_status,
    normalize_initials,
    INITIALS_MAP,
    HEAVY_COLORS,
    LIGHT_COLORS,
    NO_VCT_COLORS,
)
from parser_pptx import is_checkmark, get_cell_text


# ── Color classification tests ──────────────────────────────


class TestHexToWorkload:
    def test_heavy_dark_green(self):
        assert hex_to_workload("0E632A") == "heavy"

    def test_heavy_medium_green(self):
        assert hex_to_workload("3C7D22") == "heavy"

    def test_light_green(self):
        assert hex_to_workload("92D050") == "light"

    def test_no_vct_blue(self):
        assert hex_to_workload("DAE9F8") == "none"

    def test_none_input(self):
        assert hex_to_workload(None) == "unknown"

    def test_empty_string(self):
        assert hex_to_workload("") == "unknown"

    def test_unknown_color(self):
        assert hex_to_workload("FF0000") == "unknown"

    def test_case_insensitive(self):
        assert hex_to_workload("0e632a") == "heavy"
        assert hex_to_workload("92d050") == "light"
        assert hex_to_workload("dae9f8") == "none"

    def test_with_hash_prefix(self):
        assert hex_to_workload("#0E632A") == "heavy"
        assert hex_to_workload("#92D050") == "light"

    def test_with_whitespace(self):
        assert hex_to_workload("  0E632A  ") == "heavy"


class TestHexToStatus:
    def test_ongoing_green(self):
        assert hex_to_status("1CC853") == "ongoing"

    def test_ongoing_variant(self):
        assert hex_to_status("1CC754") == "ongoing"

    def test_to_start_orange(self):
        assert hex_to_status("FF6600") == "to_start"

    def test_completed_teal(self):
        assert hex_to_status("00827D") == "completed"

    def test_none_defaults_ongoing(self):
        assert hex_to_status(None) == "ongoing"

    def test_unknown_defaults_ongoing(self):
        assert hex_to_status("FFFFFF") == "ongoing"


# ── Initials mapping tests ──────────────────────────────────


class TestNormalizeInitials:
    def test_simple(self):
        assert normalize_initials("FC") == "FC"
        assert normalize_initials("PLA") == "PLA"

    def test_strip_digits(self):
        assert normalize_initials("FC2") == "FC"
        assert normalize_initials("PLA1") == "PLA"

    def test_lowercase(self):
        assert normalize_initials("fc") == "FC"
        assert normalize_initials("pla") == "PLA"

    def test_whitespace(self):
        assert normalize_initials("  FC  ") == "FC"

    def test_mixed(self):
        assert normalize_initials("  fc2  ") == "FC"


class TestInitialsMap:
    def test_all_known_members(self):
        expected = {
            "FC", "DA", "PLA", "AC", "SM", "CA",
            "FL", "CS", "HW", "FB", "JR", "RN",
        }
        assert set(INITIALS_MAP.keys()) == expected

    def test_pla_is_paul_louis(self):
        assert INITIALS_MAP["PLA"] == "Paul-Louis Andres"

    def test_fc_is_francois(self):
        assert INITIALS_MAP["FC"] == "Francois Candelon"


# ── Checkmark detection ─────────────────────────────────────


class TestIsCheckmark:
    def test_u_char(self):
        assert is_checkmark("u") is True

    def test_unicode_check(self):
        assert is_checkmark("\u00fc") is True  # ü
        assert is_checkmark("\u2713") is True  # ✓
        assert is_checkmark("\u2714") is True  # ✔

    def test_normal_text(self):
        assert is_checkmark("Pricing") is False
        assert is_checkmark("") is False
        assert is_checkmark("H") is False


# ── Color set consistency ────────────────────────────────────


class TestColorSets:
    def test_no_overlap(self):
        """Ensure no color appears in multiple categories."""
        assert HEAVY_COLORS.isdisjoint(LIGHT_COLORS)
        assert HEAVY_COLORS.isdisjoint(NO_VCT_COLORS)
        assert LIGHT_COLORS.isdisjoint(NO_VCT_COLORS)

    def test_all_uppercase(self):
        """Colors should be stored in uppercase."""
        for color in HEAVY_COLORS | LIGHT_COLORS | NO_VCT_COLORS:
            assert color == color.upper(), f"Color {color} should be uppercase"


# ── Integration test with golden file ────────────────────────


FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
GOLDEN_PPTX = os.path.join(FIXTURES_DIR, "Visuals.pptx")


@pytest.mark.skipif(
    not os.path.exists(GOLDEN_PPTX),
    reason="Golden file Visuals.pptx not found in fixtures/",
)
class TestGoldenFilePPTX:
    """Integration tests using the real Visuals.pptx as golden file."""

    @pytest.fixture(autouse=True)
    def parse_result(self):
        from parser_pptx import parse_staffing_pptx

        self.result = parse_staffing_pptx(GOLDEN_PPTX)

    def test_has_assignments(self):
        assert len(self.result["assignments"]) > 0

    def test_has_companies(self):
        assert len(self.result["companies_found"]) > 0

    def test_has_members(self):
        assert len(self.result["members_found"]) > 0

    def test_all_members_known(self):
        """All found initials should be in the INITIALS_MAP."""
        for initials in self.result["members_found"]:
            assert initials in INITIALS_MAP, f"Unknown initials: {initials}"

    def test_workload_values(self):
        """All assignments should have valid workload values."""
        valid = {"heavy", "light", "none", "unknown"}
        for a in self.result["assignments"]:
            assert a["workload"] in valid, f"Invalid workload: {a['workload']}"

    def test_slide_count(self):
        """Visuals.pptx has 42 slides."""
        assert self.result["slide_count"] == 42

    def test_no_warnings(self):
        """Golden file should produce no unknown initials warnings."""
        unknown_warnings = [
            w for w in self.result["warnings"] if "Unknown initials" in w
        ]
        assert len(unknown_warnings) == 0, f"Unexpected warnings: {unknown_warnings}"


@pytest.mark.skipif(
    not os.path.exists(GOLDEN_PPTX),
    reason="Golden file Visuals.pptx not found in fixtures/",
)
class TestGoldenFilePDF:
    """Test PDF parser if a PDF version exists."""

    @pytest.fixture(autouse=True)
    def check_pdf(self):
        pdf_path = os.path.join(FIXTURES_DIR, "Visuals.pdf")
        if not os.path.exists(pdf_path):
            pytest.skip("No PDF golden file found")
        from parser_pdf import parse_rdqm_pdf

        self.result = parse_rdqm_pdf(pdf_path)

    def test_has_pages(self):
        assert len(self.result["pages"]) > 0

    def test_has_warning(self):
        """PDF parser should always include the best-effort warning."""
        assert any("best-effort" in w.lower() for w in self.result["warnings"])
