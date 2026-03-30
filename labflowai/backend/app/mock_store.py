"""
mock_store.py

Lightweight in-memory database that implements the same chainable query
interface as the Supabase Python client.  Lets the entire app run without
any external services — no Supabase project, no internet connection required.

Activated automatically when SUPABASE_URL / SUPABASE_SERVICE_KEY are absent,
or explicitly via USE_MOCK_DB=true in the environment.
"""
from __future__ import annotations

import copy
import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

# ── Global in-memory tables ───────────────────────────────────────────────────

_TABLES = [
    "workflows",
    "workflow_steps",
    "materials",
    "parameters",
    "output_schemas",
    "experiment_runs",
    "run_outputs",
    "uploaded_documents",
    "audit_events",
]

_data: dict[str, list[dict]] = {t: [] for t in _TABLES}


# ── Result wrapper ────────────────────────────────────────────────────────────

class _Result:
    def __init__(self, data: Any, count: int | None = None) -> None:
        self.data = data
        self.count = count


# ── Query builder ─────────────────────────────────────────────────────────────

class _QueryBuilder:
    """Chainable builder that mirrors the postgrest-py / supabase-py interface."""

    def __init__(self, table_name: str) -> None:
        self._table = table_name
        self._rows: list[dict] = _data.setdefault(table_name, [])
        self._filters: list[tuple[str, Any]] = []
        self._order_field: str | None = None
        self._order_desc: bool = False
        self._single_mode: bool = False
        self._count_mode: str | None = None
        self._limit_n: int | None = None
        self._insert_data: list[dict] | None = None
        self._update_data: dict | None = None

    # ── Builder ──────────────────────────────────────────────────────────────

    def select(self, *_args: str, count: str | None = None) -> "_QueryBuilder":
        self._count_mode = count
        return self

    def insert(self, row: dict | list[dict]) -> "_QueryBuilder":
        self._insert_data = row if isinstance(row, list) else [row]
        return self

    def update(self, data: dict) -> "_QueryBuilder":
        self._update_data = data
        return self

    def eq(self, field: str, value: Any) -> "_QueryBuilder":
        self._filters.append((field, value))
        return self

    def order(self, field: str, desc: bool = False) -> "_QueryBuilder":
        self._order_field = field
        self._order_desc = desc
        return self

    def single(self) -> "_QueryBuilder":
        self._single_mode = True
        return self

    def limit(self, n: int) -> "_QueryBuilder":
        self._limit_n = n
        return self

    # ── Execute ───────────────────────────────────────────────────────────────

    def execute(self) -> _Result:
        # INSERT
        if self._insert_data is not None:
            for row in self._insert_data:
                self._rows.append(copy.deepcopy(row))
            logger.debug("mock_store INSERT %s (%d rows)", self._table, len(self._insert_data))
            return _Result(copy.deepcopy(self._insert_data), None)

        # UPDATE
        if self._update_data is not None:
            matched = self._apply_filters(self._rows)
            for row in matched:
                row.update(self._update_data)
            logger.debug("mock_store UPDATE %s (%d rows)", self._table, len(matched))
            return _Result(copy.deepcopy(matched), None)

        # SELECT
        rows = copy.deepcopy(self._apply_filters(self._rows))

        if self._order_field:
            try:
                rows.sort(
                    key=lambda r: (r.get(self._order_field) or ""),
                    reverse=self._order_desc,
                )
            except TypeError:
                pass

        count = len(rows) if self._count_mode == "exact" else None

        if self._limit_n is not None:
            rows = rows[: self._limit_n]

        if self._single_mode:
            return _Result(rows[0] if rows else None, count)

        return _Result(rows, count)

    # ── Internal ──────────────────────────────────────────────────────────────

    def _apply_filters(self, rows: list[dict]) -> list[dict]:
        result = rows
        for field, value in self._filters:
            result = [r for r in result if r.get(field) == value]
        return result


# ── MockDB client ─────────────────────────────────────────────────────────────

class MockDB:
    """Drop-in replacement for the Supabase client (table-level CRUD only)."""

    def table(self, name: str) -> _QueryBuilder:
        return _QueryBuilder(name)


_instance: MockDB | None = None


def get_mock_db() -> MockDB:
    global _instance
    if _instance is None:
        _instance = MockDB()
    return _instance


def reset() -> None:
    """Clear all data — useful in tests."""
    global _instance
    for table in _data:
        _data[table].clear()
    _instance = None
