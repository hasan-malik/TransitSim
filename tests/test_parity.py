"""
Cross-language engine parity test.

For every scenario in ``tests/scenarios.json``, run the Python engine
(``analysis/engine.py``) and the JS engine (``src/models/metrics-engine.js``,
invoked via the Node shim at ``tests/run_js_engine.mjs``), then assert
that every numeric field agrees within a tight tolerance and every
discrete field (grade letter) matches exactly.

This is the *only* mechanism that keeps the two implementations from
silently drifting again — see commit fc4dee5 for the historical
incident where the JS engine was recalibrated but Python was not.
"""

from __future__ import annotations

import json
import math
import shutil
import subprocess
from pathlib import Path

import pytest

from analysis.engine import calculate_metrics

REPO_ROOT  = Path(__file__).resolve().parent.parent
JS_RUNNER  = REPO_ROOT / "tests" / "run_js_engine.mjs"
SCENARIOS  = json.loads((REPO_ROOT / "tests" / "scenarios.json").read_text())

# Python (snake_case) → JS (camelCase) field name map.  Kept explicit
# rather than auto-derived so a typo on either side is caught here, not
# silently passed by name coincidence.
SCALAR_KEYS = {
    "co2_tonnes":         "co2Tonnes",
    "pm25_tonnes":        "pm25Tonnes",
    "pm25_ambient":       "pm25Ambient",
    "nox_tonnes":         "noxTonnes",
    "congestion_index":   "congestionIndex",
    "avg_commute_min":    "avgCommuteMin",
    "avg_speed_kmh":      "avgSpeedKmh",
    "noise_dba":          "noiseDBA",
    "health_index":       "healthIndex",
    "productivity_index": "productivityIndex",
    "equity_index":       "equityIndex",
    "cost_mday":          "costMday",
    "overall_score":      "overallScore",
}

SCORES_KEYS = {
    "climate":      "climate",
    "air_quality":  "airQuality",
    "congestion":   "congestion",
    "health":       "health",
    "productivity": "productivity",
    "noise":        "noise",
    "equity":       "equity",
}

REL_TOL = 1e-9
ABS_TOL = 1e-6


def _have_node() -> bool:
    return shutil.which("node") is not None


def _run_js(mix: dict) -> dict:
    """Invoke the JS engine through the Node shim and return its output dict."""
    proc = subprocess.run(
        ["node", str(JS_RUNNER)],
        input=json.dumps(mix),
        capture_output=True,
        text=True,
        timeout=15,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"JS engine shim failed (exit={proc.returncode}): {proc.stderr.strip()}"
        )
    return json.loads(proc.stdout)


@pytest.fixture(scope="session")
def node_available() -> bool:
    if not _have_node():
        pytest.skip("Node.js not on PATH — required for cross-language parity")
    return True


@pytest.mark.parametrize(
    "scenario",
    SCENARIOS,
    ids=[s["name"] for s in SCENARIOS],
)
def test_engine_parity(scenario: dict, node_available: bool) -> None:
    mix = scenario["mix"]
    py = calculate_metrics(mix)
    js = _run_js(mix)

    # --- normalised mix ----------------------------------------------------
    for mode, py_share in py["mix"].items():
        js_share = js["mix"][mode]
        assert math.isclose(py_share, js_share, rel_tol=REL_TOL, abs_tol=ABS_TOL), (
            f"{scenario['name']}: mix.{mode} drift py={py_share!r} js={js_share!r}"
        )

    # --- scalar metrics ----------------------------------------------------
    for py_key, js_key in SCALAR_KEYS.items():
        assert py_key in py, f"{scenario['name']}: missing python key {py_key!r}"
        assert js_key in js, f"{scenario['name']}: missing JS key {js_key!r}"
        assert math.isclose(py[py_key], js[js_key], rel_tol=REL_TOL, abs_tol=ABS_TOL), (
            f"{scenario['name']}: {py_key} drift py={py[py_key]!r} js={js[js_key]!r}"
        )

    # --- discrete grade letter --------------------------------------------
    assert py["grade"] == js["grade"], (
        f"{scenario['name']}: grade mismatch py={py['grade']!r} js={js['grade']!r}"
    )

    # --- radar sub-scores (rounded ints in both engines) -------------------
    for py_key, js_key in SCORES_KEYS.items():
        assert py["scores"][py_key] == js["scores"][js_key], (
            f"{scenario['name']}: scores.{py_key} drift "
            f"py={py['scores'][py_key]} js={js['scores'][js_key]}"
        )


def test_scenarios_file_is_well_formed() -> None:
    """Belt-and-braces guard so a malformed fixtures file fails fast."""
    assert isinstance(SCENARIOS, list) and len(SCENARIOS) > 0
    seen_names = set()
    for s in SCENARIOS:
        assert {"name", "mix"} <= s.keys(), f"scenario missing keys: {s}"
        assert s["name"] not in seen_names, f"duplicate scenario name: {s['name']}"
        seen_names.add(s["name"])
        assert set(s["mix"].keys()) == {"car", "bus", "subway", "cycling", "pedestrian", "other"}, (
            f"scenario {s['name']} has wrong mix keys: {s['mix']}"
        )
