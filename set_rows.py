"""Reusable labeled rows for entry forms."""

import tkinter as tk
from tkinter import messagebox, ttk

from data_store import TrackStore
from models import TrackEntry, normalize_set_label
from set_label_manager import SetLabelManagerDialog
from theme import FONTS


class SetRowsForm:
    def __init__(self, parent: tk.Widget, store: TrackStore, on_labels_changed) -> None:
        self.parent = parent
        self.store = store
        self.on_labels_changed = on_labels_changed
        self.container = ttk.Frame(parent)
        self._rows: list[tuple[ttk.Frame, tk.StringVar, tk.StringVar, ttk.Combobox]] = []
        self._header_added = False

    def pack(self, **kwargs) -> None:
        self.container.pack(**kwargs)

    def refresh_labels(self) -> None:
        options = self.store.dropdown_set_labels()
        for _, _, _, combo in self._rows:
            combo["values"] = options

    def open_label_manager(self) -> None:
        SetLabelManagerDialog(self.parent, self.store, on_change=self._on_labels_managed)

    def _on_labels_managed(self, **kwargs) -> None:
        if new_label := kwargs.get("new_label"):
            for _, label_var, _, _ in self._rows:
                if label_var.get() == kwargs.get("old_label"):
                    label_var.set(new_label)
        self.refresh_labels()
        self.on_labels_changed()

    def _ensure_header(self) -> None:
        if self._header_added:
            return
        header = ttk.Frame(self.container)
        header.pack(anchor=tk.W, pady=(0, 4))
        ttk.Label(header, text="Label", style="Muted.TLabel", width=18).pack(side=tk.LEFT)
        ttk.Label(header, text="Value", style="Muted.TLabel", width=12).pack(side=tk.LEFT, padx=(8, 0))
        self._header_added = True

    def add_row(self, label: str = "", value: str = "") -> None:
        self._ensure_header()
        row = ttk.Frame(self.container)
        row.pack(anchor=tk.W, pady=3)

        label_var = tk.StringVar(value=label)
        label_combo = ttk.Combobox(
            row,
            textvariable=label_var,
            values=self.store.dropdown_set_labels(),
            width=18,
            state="normal",
            font=FONTS["body"],
        )
        label_combo.pack(side=tk.LEFT)

        value_var = tk.StringVar(value=value)
        ttk.Entry(row, textvariable=value_var, width=12).pack(side=tk.LEFT, padx=(8, 8))

        def remove() -> None:
            if len(self._rows) <= 1:
                messagebox.showinfo("Rows", "Keep at least one row.", parent=self.parent)
                return
            self._rows.remove((row, label_var, value_var, label_combo))
            row.destroy()

        ttk.Button(row, text="Remove", style="Ghost.TButton", command=remove).pack(side=tk.LEFT)
        self._rows.append((row, label_var, value_var, label_combo))

    def load_entry(self, entry: TrackEntry) -> None:
        self.clear()
        for label, value in zip(entry.set_labels, entry.set_values):
            text = str(int(value)) if value == int(value) else f"{value:g}"
            self.add_row(label=label, value=text)
        if not self._rows:
            self.add_row()

    def clear_values(self) -> None:
        for _, label_var, value_var, _ in self._rows:
            label_var.set("")
            value_var.set("")

    def clear(self) -> None:
        for row, _, _, _ in self._rows:
            row.destroy()
        self._rows.clear()
        for child in self.container.winfo_children():
            child.destroy()
        self._header_added = False

    def parse(self) -> tuple[list[str], list[float]]:
        labels: list[str] = []
        values: list[float] = []
        for _, label_var, value_var, _ in self._rows:
            value_text = value_var.get().strip()
            if not value_text:
                continue
            label = normalize_set_label(label_var.get())
            if not label:
                raise ValueError("Type a label for each value (e.g. Breakfast or Second weigh-in).")
            try:
                values.append(float(value_text))
            except ValueError:
                raise ValueError(f"Invalid number: {value_text!r}")
            labels.append(label)
        return labels, values
