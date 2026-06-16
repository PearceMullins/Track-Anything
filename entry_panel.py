"""Data entry form with dynamic rows."""

import tkinter as tk
from datetime import date
from tkinter import messagebox, ttk

from data_store import TrackStore
from date_picker import DatePicker
from models import (
    TrackEntry,
    logged_at_for_entry_date,
    normalize_exercise_name,
    normalize_unit,
    today_iso,
)
from name_manager import NameManagerDialog
from set_rows import SetRowsForm
from theme import FONTS, style_text_widget
from unit_manager import UnitManagerDialog


class EntryPanel(ttk.Frame):
    def __init__(self, parent, store: TrackStore, on_save, on_names_changed) -> None:
        super().__init__(parent)
        self.store = store
        self.on_save = on_save
        self.on_names_changed = on_names_changed
        self._draft_calendar_day = today_iso()
        self._build()
        self.refresh_exercises()

    def _build(self) -> None:
        form = ttk.LabelFrame(self, text="  Log Entry  ", style="Card.TLabelframe", padding=16)
        form.pack(fill=tk.X, padx=12, pady=(4, 8))

        row0 = ttk.Frame(form, style="Card.TFrame")
        row0.pack(fill=tk.X, pady=(0, 10))

        ttk.Label(row0, text="Name", style="Card.TLabel", width=8).grid(row=0, column=0, sticky=tk.W)
        self.exercise_var = tk.StringVar()
        self.exercise_combo = ttk.Combobox(
            row0,
            textvariable=self.exercise_var,
            width=24,
            state="normal",
            font=FONTS["body"],
        )
        self.exercise_combo.grid(row=0, column=1, sticky=tk.W, padx=(4, 8))
        ttk.Button(row0, text="Manage", style="Ghost.TButton", command=self._open_name_manager).grid(
            row=0, column=2, sticky=tk.W, padx=(0, 16)
        )

        ttk.Label(row0, text="Date", style="Card.TLabel", width=6).grid(row=0, column=3, sticky=tk.W)
        self.date_var = tk.StringVar(value=today_iso())
        DatePicker(row0, date_var=self.date_var).grid(row=0, column=4, sticky=tk.W, padx=4)

        row1 = ttk.Frame(form, style="Card.TFrame")
        row1.pack(fill=tk.X, pady=(0, 12))

        ttk.Label(row1, text="Unit", style="Card.TLabel", width=8).grid(row=0, column=0, sticky=tk.W)
        self.unit_var = tk.StringVar()
        self.unit_combo = ttk.Combobox(
            row1,
            textvariable=self.unit_var,
            width=24,
            state="normal",
            font=FONTS["body"],
        )
        self.unit_combo.grid(row=0, column=1, sticky=tk.W, padx=(4, 8))
        ttk.Button(row1, text="Manage", style="Ghost.TButton", command=self._open_unit_manager).grid(
            row=0, column=2, sticky=tk.W
        )

        ttk.Label(
            form,
            style="CardMuted.TLabel",
            text="Type any name, unit, or row label — suggestions appear from your history as you go.",
            wraplength=640,
        ).pack(anchor=tk.W, pady=(0, 10))

        self.set_rows = SetRowsForm(form, self.store, on_labels_changed=self.on_names_changed)
        self.set_rows.pack(anchor=tk.W, fill=tk.X)
        self.set_rows.add_row()

        btn_row = ttk.Frame(form, style="Card.TFrame")
        btn_row.pack(anchor=tk.W, pady=(10, 0))

        ttk.Button(btn_row, text="+ Add Row", command=self.set_rows.add_row).pack(side=tk.LEFT)
        ttk.Button(btn_row, text="Manage Labels", style="Ghost.TButton", command=self.set_rows.open_label_manager).pack(
            side=tk.LEFT, padx=(8, 0)
        )
        ttk.Button(
            btn_row,
            text="Save Entry",
            style="Accent.TButton",
            command=self._save,
        ).pack(side=tk.LEFT, padx=(16, 0))

        ttk.Label(form, text="Notes", style="Card.TLabel").pack(anchor=tk.W, pady=(14, 4))
        self.notes_text = tk.Text(form, height=2, width=54)
        style_text_widget(self.notes_text)
        self.notes_text.pack(anchor=tk.W)

    def refresh_exercises(self) -> None:
        self.exercise_combo["values"] = self.store.dropdown_names()
        self.unit_combo["values"] = self.store.dropdown_units()
        self.set_rows.refresh_labels()

    def _open_name_manager(self) -> None:
        NameManagerDialog(self, self.store, on_change=self._on_names_managed)

    def _open_unit_manager(self) -> None:
        UnitManagerDialog(self, self.store, on_change=self._on_units_managed)

    def _on_names_managed(self, **kwargs) -> None:
        if new_name := kwargs.get("new_name"):
            self.exercise_var.set(new_name)
        elif deleted_name := kwargs.get("deleted_name"):
            if self.exercise_var.get() == deleted_name:
                self.exercise_var.set("")
        self.on_names_changed()

    def _on_units_managed(self, **kwargs) -> None:
        if new_unit := kwargs.get("new_unit"):
            self.unit_var.set(new_unit)
        elif deleted_unit := kwargs.get("deleted_unit"):
            if self.unit_var.get() == deleted_unit:
                self.unit_var.set("")
        self.on_names_changed()

    def _save(self) -> None:
        exercise = normalize_exercise_name(self.exercise_var.get())
        if not exercise:
            messagebox.showwarning("Missing name", "Type a name to track.")
            return

        entry_date = self.date_var.get().strip()
        try:
            date.fromisoformat(entry_date)
        except ValueError:
            messagebox.showwarning("Invalid date", "Use YYYY-MM-DD format.")
            return

        try:
            set_labels, set_values = self.set_rows.parse()
        except ValueError as exc:
            messagebox.showwarning("Invalid values", str(exc))
            return

        if not set_values:
            messagebox.showwarning("No values", "Enter at least one value.")
            return

        unit = normalize_unit(self.unit_var.get())
        if not unit:
            messagebox.showwarning("Missing unit", "Type a unit (e.g. lbs, kcal, min).")
            return

        notes = self.notes_text.get("1.0", tk.END).strip()
        entry = TrackEntry(
            exercise=exercise,
            entry_date=entry_date,
            set_values=set_values,
            set_labels=set_labels,
            notes=notes,
            logged_at=logged_at_for_entry_date(entry_date),
            unit=unit,
        )
        self.on_save(entry)
        self._clear_form()

    def refresh_date_for_new_day(self) -> None:
        today = today_iso()
        if self._draft_calendar_day != today:
            self.date_var.set(today)
            self._draft_calendar_day = today

    def _clear_form(self) -> None:
        self.set_rows.clear_values()
        self.notes_text.delete("1.0", tk.END)
        today = today_iso()
        self.date_var.set(today)
        self._draft_calendar_day = today
