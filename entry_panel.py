"""Workout entry form with dynamic set/rep rows."""

import tkinter as tk
from datetime import date
from tkinter import messagebox, ttk

from data_store import WorkoutStore
from date_picker import DatePicker
from models import (
    UNIT_PRESETS,
    WorkoutEntry,
    logged_at_for_workout_date,
    normalize_exercise_name,
    normalize_unit,
    today_iso,
)
from theme import style_text_widget


class EntryPanel(ttk.Frame):
    def __init__(self, parent, store: WorkoutStore, on_save) -> None:
        super().__init__(parent)
        self.store = store
        self.on_save = on_save
        self._set_rows: list[ttk.Frame] = []
        self._build()
        self.refresh_exercises()

    def _build(self) -> None:
        form = ttk.LabelFrame(self, text="Log Workout", padding=12)
        form.pack(fill=tk.X, padx=8, pady=8)

        row0 = ttk.Frame(form)
        row0.pack(fill=tk.X, pady=(0, 8))

        ttk.Label(row0, text="Name:").pack(side=tk.LEFT)
        self.exercise_var = tk.StringVar()
        self.exercise_combo = ttk.Combobox(
            row0,
            textvariable=self.exercise_var,
            width=26,
            state="normal",
        )
        self.exercise_combo.pack(side=tk.LEFT, padx=(8, 16))

        ttk.Label(row0, text="Date:").pack(side=tk.LEFT)
        self.date_var = tk.StringVar(value=today_iso())
        DatePicker(row0, date_var=self.date_var).pack(side=tk.LEFT, padx=8)

        row1 = ttk.Frame(form)
        row1.pack(fill=tk.X, pady=(0, 8))

        ttk.Label(row1, text="Unit:").pack(side=tk.LEFT)
        self.unit_var = tk.StringVar(value="reps")
        self.unit_combo = ttk.Combobox(
            row1,
            textvariable=self.unit_var,
            values=UNIT_PRESETS,
            width=10,
            state="normal",
        )
        self.unit_combo.pack(side=tk.LEFT, padx=(8, 0))

        hint = ttk.Label(
            form,
            style="Muted.TLabel",
            text="Pick a previous name from the dropdown or type a new one "
            "(e.g. Body Weight, Pushups, Running). Choose a unit. Each row is one set.",
            wraplength=620,
        )
        hint.pack(anchor=tk.W, pady=(0, 8))

        self.sets_container = ttk.Frame(form)
        self.sets_container.pack(fill=tk.X)

        btn_row = ttk.Frame(form)
        btn_row.pack(fill=tk.X, pady=(8, 0))

        ttk.Button(btn_row, text="+ Add Set", command=self._add_set_row).pack(side=tk.LEFT)
        ttk.Button(btn_row, text="Save Workout", style="Accent.TButton", command=self._save).pack(
            side=tk.RIGHT
        )

        ttk.Label(form, text="Notes (optional):").pack(anchor=tk.W, pady=(10, 2))
        self.notes_text = tk.Text(form, height=2, width=60)
        style_text_widget(self.notes_text)
        self.notes_text.pack(fill=tk.X)

        self._add_set_row()
        self._add_set_row()
        self._add_set_row()

    def refresh_exercises(self) -> None:
        names = self.store.exercise_names()
        self.exercise_combo["values"] = names

    def _add_set_row(self) -> None:
        idx = len(self._set_rows) + 1
        row = ttk.Frame(self.sets_container)
        row.pack(fill=tk.X, pady=2)

        ttk.Label(row, text=f"Set {idx}:", width=8).pack(side=tk.LEFT)
        var = tk.StringVar()
        ttk.Entry(row, textvariable=var, width=12).pack(side=tk.LEFT, padx=(0, 8))

        def remove() -> None:
            if len(self._set_rows) <= 1:
                messagebox.showinfo("Sets", "Keep at least one set row.")
                return
            self._set_rows.remove((row, var))
            row.destroy()
            self._relabel_sets()

        ttk.Button(row, text="Remove", command=remove).pack(side=tk.RIGHT)
        self._set_rows.append((row, var))

    def _relabel_sets(self) -> None:
        for i, (row, _) in enumerate(self._set_rows, start=1):
            label = row.winfo_children()[0]
            if isinstance(label, ttk.Label):
                label.config(text=f"Set {i}:")

    def _parse_set_values(self) -> list[float]:
        values: list[float] = []
        for _, var in self._set_rows:
            text = var.get().strip()
            if not text:
                continue
            try:
                values.append(float(text))
            except ValueError:
                raise ValueError(f"Invalid number: {text!r}")
        return values

    def _save(self) -> None:
        exercise = normalize_exercise_name(self.exercise_var.get())
        if not exercise:
            messagebox.showwarning("Missing name", "Enter or select a name to track.")
            return

        workout_date = self.date_var.get().strip()
        try:
            date.fromisoformat(workout_date)
        except ValueError:
            messagebox.showwarning("Invalid date", "Use YYYY-MM-DD format.")
            return

        try:
            set_values = self._parse_set_values()
        except ValueError as exc:
            messagebox.showwarning("Invalid values", str(exc))
            return

        if not set_values:
            messagebox.showwarning("No sets", "Enter at least one set value.")
            return

        unit = normalize_unit(self.unit_var.get())
        if not unit:
            messagebox.showwarning("Missing unit", "Choose or enter a unit (reps, min, mi, lbs, etc.).")
            return

        notes = self.notes_text.get("1.0", tk.END).strip()
        entry = WorkoutEntry(
            exercise=exercise,
            workout_date=workout_date,
            set_values=set_values,
            notes=notes,
            logged_at=logged_at_for_workout_date(workout_date),
            unit=unit,
        )
        self.on_save(entry)
        self._clear_form()

    def _clear_form(self) -> None:
        for _, var in self._set_rows:
            var.set("")
        self.notes_text.delete("1.0", tk.END)
