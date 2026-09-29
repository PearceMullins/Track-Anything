"""Data models for tracked entries."""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, asdict
from datetime import date, datetime, time
from typing import Any

VALUE_SUGGESTIONS = ("10 reps", "5 reps", "20 reps", "3 miles", "30 minutes", "200 lbs", "150 lbs")

NOTE_SUGGESTIONS = ("Morning", "Evening", "Felt good", "PR day")

DEFAULT_PROFILE = "Default"


@dataclass
class TrackEntry:
    """A single logged session for one tracked name."""

    exercise: str
    entry_date: str  # ISO format YYYY-MM-DD
    value: str
    notes: str = ""
    logged_at: str = ""

    def __post_init__(self) -> None:
        self.value = canonical_value_text(self.value)

    @property
    def numeric_value(self) -> float:
        return parse_numeric_value(self.value)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "TrackEntry":
        entry_date = data.get("entry_date") or data.get("workout_date")
        if not entry_date:
            raise KeyError("entry_date")
        if data.get("value"):
            return cls(
                exercise=data["exercise"],
                entry_date=entry_date,
                value=str(data["value"]),
                notes=data.get("notes", ""),
                logged_at=data.get("logged_at", ""),
            )
        if data.get("set_values"):
            return _migrate_legacy_entry(data, entry_date)
        return cls(
            exercise=data["exercise"],
            entry_date=entry_date,
            value="",
            notes=data.get("notes", ""),
            logged_at=data.get("logged_at", ""),
        )


def _migrate_legacy_entry(data: dict[str, Any], entry_date: str) -> "TrackEntry":
    unit = normalize_unit(data.get("unit", ""))
    set_values = [_coerce_value_text(v, unit) for v in data["set_values"]]
    set_labels = [str(label) for label in data.get("set_labels") or []]
    value = canonical_value_text(set_values[0]) if set_values else ""
    notes = str(data.get("notes", ""))
    if len(set_values) > 1:
        extra_parts = []
        for i, row_value in enumerate(set_values[1:], start=2):
            label = set_labels[i - 1].strip() if i - 1 < len(set_labels) and set_labels[i - 1].strip() else f"Row {i}"
            extra_parts.append(f"{label}: {row_value}")
        extra = "; ".join(extra_parts)
        notes = f"{notes}\n{extra}".strip() if notes else extra
    return TrackEntry(
        exercise=data["exercise"],
        entry_date=entry_date,
        value=value,
        notes=notes,
        logged_at=data.get("logged_at", ""),
    )


def normalize_unit(unit: str) -> str:
    return " ".join(unit.strip().split())


def normalize_exercise_name(name: str) -> str:
    return " ".join(name.strip().split())


def normalize_profile_name(name: str) -> str:
    return " ".join(name.strip().split())


def normalize_value_text(value: str) -> str:
    return " ".join(value.strip().split())


def normalize_note_text(note: str) -> str:
    return note.strip()


def canonical_note_text(note: str) -> str:
    normalized = normalize_note_text(note)
    lower = normalized.casefold()
    for suggestion in NOTE_SUGGESTIONS:
        if suggestion.casefold() == lower:
            return suggestion
    return normalized


def canonical_value_text(value: str) -> str:
    normalized = normalize_value_text(value)
    lower = normalized.casefold()
    for suggestion in VALUE_SUGGESTIONS:
        if suggestion.casefold() == lower:
            return suggestion
    return normalized


def parse_numeric_value(text: str) -> float:
    return resolve_numeric_value(text, "first_number")


FORMULA_PRESETS = (
    "first_number",
    "last_number",
    "sum_numbers",
    "product_numbers",
    "max_number",
    "min_number",
)

CHAIN_OPERATORS = ("+", "-", "*", "/", "^", "%")

FORMULA_FUNCTIONS = (
    "abs",
    "avg",
    "sum",
    "min",
    "max",
    "round",
    "floor",
    "ceil",
    "sqrt",
)

FORMULA_CONSTANTS = {"pi": math.pi, "tau": math.tau, "e": math.e}

_NUMBER_RE = re.compile(r"[-+]?\d*\.?\d+")

MAX_INPUT_LABEL_LENGTH = 24


def _clean_formula_labels(spec: Any) -> Any:
    """Input names live next to the expression: {"a": "sets", "b": "reps"}."""
    if not isinstance(spec, dict):
        return spec
    raw = spec.get("labels")
    labels: dict[str, str] = {}
    if isinstance(raw, dict):
        for key, value in raw.items():
            name = str(key).strip().lower()
            if len(name) == 1 and "a" <= name <= "l":
                label = str(value).strip()[:MAX_INPUT_LABEL_LENGTH]
                if label:
                    labels[name] = label
    cleaned = {"expr": spec.get("expr", "")}
    if labels:
        cleaned["labels"] = labels
    return cleaned


def empty_value_formulas() -> dict[str, Any]:
    return {"default": "first_number", "by_name": {}}


def _is_formula_spec(value: Any) -> bool:
    if isinstance(value, str) and value in FORMULA_PRESETS:
        return True
    if isinstance(value, dict) and isinstance(value.get("expr"), str):
        return True
    return False


def is_formula_spec(value: Any) -> bool:
    return _is_formula_spec(value)


def normalize_value_formulas(raw: Any) -> dict[str, Any]:
    empty = empty_value_formulas()
    if not isinstance(raw, dict):
        return empty
    default = raw.get("default")
    if not _is_formula_spec(default):
        default = empty["default"]
    else:
        default = _clean_formula_labels(default)
    by_name: dict[str, Any] = {}
    raw_by = raw.get("by_name")
    if isinstance(raw_by, dict):
        for name, spec in raw_by.items():
            if name and _is_formula_spec(spec):
                by_name[str(name)] = _clean_formula_labels(spec)
    return {"default": default, "by_name": by_name}


def formula_for_name(config: dict[str, Any] | None, name: str) -> Any:
    cfg = config if isinstance(config, dict) else empty_value_formulas()
    by_name = cfg.get("by_name") if isinstance(cfg.get("by_name"), dict) else {}
    if name in by_name:
        return by_name[name]
    default = cfg.get("default", "first_number")
    return default if _is_formula_spec(default) else "first_number"


def extract_numbers(text: str) -> list[float]:
    out: list[float] = []
    for match in _NUMBER_RE.finditer(text):
        token = match.group()
        if token in {"", "+", "-", "."}:
            continue
        try:
            out.append(float(token))
        except ValueError:
            continue
    return out


def resolve_numeric_value(text: str, formula: Any = "first_number") -> float:
    if isinstance(formula, dict) and "expr" in formula:
        return _eval_safe_expr(str(formula.get("expr", "")), extract_numbers(text))
    nums = extract_numbers(text)
    if formula == "last_number":
        return nums[-1] if nums else 0.0
    if formula == "sum_numbers":
        return float(sum(nums))
    if formula == "product_numbers":
        if not nums:
            return 0.0
        product = 1.0
        for n in nums:
            product *= n
        return product
    if formula == "max_number":
        return max(nums) if nums else 0.0
    if formula == "min_number":
        return min(nums) if nums else 0.0
    return nums[0] if nums else 0.0


def set_formula_for_name(config: dict[str, Any], name: str, spec: Any) -> dict[str, Any]:
    cfg = normalize_value_formulas(config)
    by_name = dict(cfg["by_name"])
    default = cfg["default"]
    if _formula_specs_equal(default, spec):
        by_name.pop(name, None)
    else:
        by_name[name] = spec
    return {"default": default, "by_name": by_name}

def _formula_specs_equal(a: Any, b: Any) -> bool:
    if isinstance(a, str) or isinstance(b, str):
        return a == b
    if isinstance(a, dict) and isinstance(b, dict):
        if a.get("expr") != b.get("expr"):
            return False
        return _clean_formula_labels(a).get("labels") == _clean_formula_labels(b).get("labels")
    return False


def normalize_saved_equations(raw: Any) -> list[dict[str, Any]]:
    """Named equations a profile can reuse across tracked names."""
    if not isinstance(raw, list):
        return []
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in raw:
        if not isinstance(item, dict):
            continue
        label = str(item.get("label", "")).strip()
        spec = item.get("spec")
        if not label or label.lower() in seen or not _is_formula_spec(spec):
            continue
        seen.add(label.lower())
        out.append({"label": label, "spec": _clean_formula_labels(spec)})
    return out


def set_saved_equation(equations: Any, label: str, spec: Any) -> list[dict[str, Any]]:
    clean = str(label).strip()
    if not clean:
        raise ValueError("Label cannot be empty.")
    if not _is_formula_spec(spec):
        raise ValueError("Invalid equation.")
    remaining = [
        item
        for item in normalize_saved_equations(equations)
        if item["label"].lower() != clean.lower()
    ]
    return [*remaining, {"label": clean, "spec": _clean_formula_labels(spec)}]


def remove_saved_equation(equations: Any, label: str) -> list[dict[str, Any]]:
    target = str(label).strip().lower()
    return [
        item
        for item in normalize_saved_equations(equations)
        if item["label"].lower() != target
    ]


def set_default_formula(config: dict[str, Any], spec: Any) -> dict[str, Any]:
    """Sets the fallback formula and drops per-name overrides that match it."""
    cfg = normalize_value_formulas(config)
    by_name = {
        name: existing
        for name, existing in cfg["by_name"].items()
        if not _formula_specs_equal(existing, spec)
    }
    return {"default": spec, "by_name": by_name}


def rename_formula_name(config: dict[str, Any], old_name: str, new_name: str) -> dict[str, Any]:
    cfg = normalize_value_formulas(config)
    by_name = dict(cfg["by_name"])
    if old_name == new_name or old_name not in by_name:
        return cfg
    by_name[new_name] = by_name.pop(old_name)
    return {"default": cfg["default"], "by_name": by_name}


def remove_formula_name(config: dict[str, Any], name: str) -> dict[str, Any]:
    cfg = normalize_value_formulas(config)
    by_name = dict(cfg["by_name"])
    by_name.pop(name, None)
    return {"default": cfg["default"], "by_name": by_name}


def _eval_safe_expr(expr: str, numbers: list[float]) -> float:
    trimmed = expr.strip()
    if not trimmed:
        return 0.0
    try:
        tokens = _tokenize_expr(trimmed)
        parser = _ExprParser(tokens, numbers)
        value = parser.parse_expression()
        parser.expect_end()
        return float(value) if value == value and abs(value) != float("inf") else 0.0
    except Exception:
        return 0.0


def _tokenize_expr(expr: str) -> list[tuple]:
    tokens: list[tuple] = []
    i = 0
    while i < len(expr):
        ch = expr[i]
        if ch.isspace():
            i += 1
            continue
        if ch == ",":
            tokens.append(("comma",))
            i += 1
            continue
        if ch in "+-*/%^()":
            if ch == "(":
                tokens.append(("lparen",))
            elif ch == ")":
                tokens.append(("rparen",))
            else:
                tokens.append(("op", ch))
            i += 1
            continue
        if ch.isalpha():
            j = i + 1
            while j < len(expr) and expr[j].isalpha():
                j += 1
            tokens.append(("name", expr[i:j].lower()))
            i = j
            continue
        if ch.isdigit() or ch == ".":
            j = i + 1
            while j < len(expr) and (expr[j].isdigit() or expr[j] == "."):
                j += 1
            tokens.append(("num", float(expr[i:j])))
            i = j
            continue
        raise ValueError("bad char")
    return tokens


def _is_variable_token(name: str) -> bool:
    return len(name) == 1 and "a" <= name <= "z"


def _safe_pow(base: float, exponent: float) -> float:
    try:
        value = base**exponent
    except (OverflowError, ZeroDivisionError, ValueError):
        return 0.0
    if isinstance(value, complex):
        return 0.0
    if math.isnan(value) or math.isinf(value):
        return 0.0
    return float(value)


def _apply_function(name: str, args: list[float], numbers: list[float]) -> float:
    values = args if args else numbers
    if name == "abs":
        return abs(args[0] if args else 0.0)
    if name == "avg":
        return sum(values) / len(values) if values else 0.0
    if name == "sum":
        return float(sum(values))
    if name == "min":
        return min(values) if values else 0.0
    if name == "max":
        return max(values) if values else 0.0
    if name == "round":
        return math.floor((args[0] if args else 0.0) + 0.5)
    if name == "floor":
        return math.floor(args[0] if args else 0.0)
    if name == "ceil":
        return math.ceil(args[0] if args else 0.0)
    if name == "sqrt":
        value = args[0] if args else 0.0
        return 0.0 if value < 0 else math.sqrt(value)
    raise ValueError("bad function")


class _ExprParser:
    def __init__(self, tokens: list[tuple], numbers: list[float]) -> None:
        self.tokens = tokens
        self.numbers = numbers
        self.i = 0

    def expect_end(self) -> None:
        if self.i < len(self.tokens):
            raise ValueError("trailing")

    def parse_expression(self) -> float:
        left = self._parse_term()
        while self._match_op("+") or self._match_op("-"):
            op = self.tokens[self.i - 1][1]
            right = self._parse_term()
            left = left + right if op == "+" else left - right
        return left

    def _parse_term(self) -> float:
        left = self._parse_unary()
        while self._match_op("*") or self._match_op("/") or self._match_op("%"):
            op = self.tokens[self.i - 1][1]
            right = self._parse_unary()
            if op == "*":
                left = left * right
            elif op == "/":
                left = 0.0 if right == 0 else left / right
            else:
                left = 0.0 if right == 0 else left - right * math.trunc(left / right)
        return left

    def _parse_unary(self) -> float:
        if self._match_op("+"):
            return self._parse_unary()
        if self._match_op("-"):
            return -self._parse_unary()
        return self._parse_power()

    def _parse_power(self) -> float:
        base = self._parse_primary()
        if self._match_op("^"):
            return _safe_pow(base, self._parse_unary())
        return base

    def _parse_primary(self) -> float:
        if self.i >= len(self.tokens):
            raise ValueError("eof")
        tok = self.tokens[self.i]
        kind = tok[0]
        if kind == "num":
            self.i += 1
            return float(tok[1])
        if kind == "name":
            self.i += 1
            name = str(tok[1])
            if _is_variable_token(name):
                idx = ord(name) - ord("a")
                return self.numbers[idx] if idx < len(self.numbers) else 0.0
            if name in FORMULA_FUNCTIONS:
                return self._call_function(name)
            if name in FORMULA_CONSTANTS:
                return float(FORMULA_CONSTANTS[name])
            raise ValueError("bad name")
        if kind == "lparen":
            self.i += 1
            value = self.parse_expression()
            if self.i >= len(self.tokens) or self.tokens[self.i][0] != "rparen":
                raise ValueError("paren")
            self.i += 1
            return value
        raise ValueError("primary")

    def _call_function(self, name: str) -> float:
        if self.i >= len(self.tokens) or self.tokens[self.i][0] != "lparen":
            raise ValueError("expected args")
        self.i += 1
        args: list[float] = []
        while self.i < len(self.tokens) and self.tokens[self.i][0] != "rparen":
            args.append(self.parse_expression())
            if self.i < len(self.tokens) and self.tokens[self.i][0] == "comma":
                self.i += 1
        if self.i >= len(self.tokens) or self.tokens[self.i][0] != "rparen":
            raise ValueError("args")
        self.i += 1
        return _apply_function(name, args, self.numbers)

    def _match_op(self, op: str) -> bool:
        if self.i < len(self.tokens) and self.tokens[self.i][0] == "op" and self.tokens[self.i][1] == op:
            self.i += 1
            return True
        return False


def _coerce_value_text(raw: Any, unit: str) -> str:
    if isinstance(raw, str):
        return normalize_value_text(raw)
    number = float(raw)
    text = str(int(number)) if number == int(number) else f"{number:g}"
    if unit:
        return f"{text} {unit}"
    return text


def today_iso() -> str:
    return date.today().isoformat()


def logged_at_for_entry_date(entry_date: str) -> str:
    """Timestamp used for ordering entries that share the same date."""
    picked = date.fromisoformat(entry_date)
    now = datetime.now()
    if picked == date.today():
        return datetime.combine(picked, now.time().replace(microsecond=0)).isoformat()
    return datetime.combine(picked, time(12, 0)).isoformat()
