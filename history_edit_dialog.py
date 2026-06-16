"""Dialog for editing an existing history entry."""

import tkinter as tk
from datetime import date
from tkinter import messagebox, ttk

from data_store import TrackStore
from date_picker import DatePicker
from models import TrackEntry, normalize_exercise_name, normalize_unit
from set_rows import SetRowsForm
from theme import FONTS, apply_dark_theme, style_text_widget
from unit_manager import UnitManagerDialog


class HistoryEditDialog(tk.Toplevel):
    def __init__(
        self,
        parent: tk.Widget,
        store: TrackStore,
        entry_index: int,
        entry: TrackEntry,
        on_saved,
    ) -> None:
        super().__init__(parent)
        self.store = store
        self.entry_index = entry_index
        self.original_entry = entry
        self.on_saved = on_saved

        self.title("Edit Entry")
        self.geometry("580x480")
        self.minsize(520, 400)
        self.transient(parent.winfo_toplevel())
        self.grab_set()
        apply_dark_theme(self)

        self._build()
        self.set_rows.load_entry(entry)
        self._load_fields(entry)
        self._center_on(parent)

    def _center_on(self, parent: tk.Widget) -> None:
        self.update_idletasks()
        self.geometry(f"+{parent.winfo_rootx() + 40}+{parent.winfo_rooty() + 40}")

    def _build(self) -> None:
        outer = ttk.LabelFrame(self, text="  Edit Entry  ", style="Card.TLabelframe", padding=16)
        outer.pack(fill=tk.BOTH, expand=True, padx=12, pady=12)

        row0 = ttk.Frame(outer, style="Card.TFrame")
        row0.pack(fill=tk.X, pady=(0, 10))

        ttk.Label(row0, text="Name", style="Card.TLabel", width=8).grid(row=0, column=0, sticky=tk.W)
        self.exercise_var = tk.StringVar()
        self.exercise_combo = ttk.Combobox(
            row0,
            textvariable=self.exercise_var,
            values=self.store.dropdown_names(),
            width=24,
            state="normal",
            font=FONTS["body"],
        )
        self.exercise_combo.grid(row=0, column=1, sticky=tk.W, padx=(4, 16))

        ttk.Label(row0, text="Date", style="Card.TLabel", width=6).grid(row=0, column=2, sticky=tk.W)
        self.date_var = tk.StringVar()
        DatePicker(row0, date_var=self.date_var).grid(row=0, column=3, sticky=tk.W, padx=4)

        row1 = ttk.Frame(outer, style="Card.TFrame")
        row1.pack(fill=tk.X, pady=(0, 12))

        ttk.Label(row1, text="Unit", style="Card.TLabel", width=8).grid(row=0, column=0, sticky=tk.W)
        self.unit_var = tk.StringVar()
        self.unit_combo = ttk.Combobox(
            row1,
            textvariable=self.unit_var,
            values=self.store.dropdown_units(),
            width=24,
            state="normal",
            font=FONTS["body"],
        )
        self.unit_combo.grid(row=0, column=1, sticky=tk.W, padx=(4, 8))
        ttk.Button(row1, text="Manage", style="Ghost.TButton", command=self._open_unit_manager).grid(
            row=0, column=2, sticky=tk.W
        )

        self.set_rows = SetRowsForm(outer, self.store, on_labels_changed=self._refresh_dropdowns)
        self.set_rows.pack(anchor=tk.W, fill=tk.X)

        sets_btns = ttk.Frame(outer, style="Card.TFrame")
        sets_btns.pack(fill=tk.X, pady=(8, 0))
        ttk.Button(sets_btns, text="+ Add Row", command=self.set_rows.add_row).pack(side=tk.LEFT)
        ttk.Button(sets_btns, text="Manage Labels", style="Ghost.TButton", command=self.set_rows.open_label_manager).pack(
            side=tk.LEFT, padx=(8, 0)
        )

        ttk.Label(outer, text="Notes", style="Card.TLabel").pack(anchor=tk.W, pady=(12, 4))
        self.notes_text = tk.Text(outer, height=2, width=58)
        style_text_widget(self.notes_text)
        self.notes_text.pack(fill=tk.X, pady=(0, 12))

        btn_row = ttk.Frame(outer, style="Card.TFrame")
        btn_row.pack(fill=tk.X)
        ttk.Button(btn_row, text="Cancel", style="Ghost.TButton", command=self.destroy).pack(side=tk.RIGHT, padx=(8, 0))
        ttk.Button(btn_row, text="Save Changes", style="Accent.TButton", command=self._save).pack(side=tk.RIGHT)

    def _load_fields(self, entry: TrackEntry) -> None:
        self.exercise_var.set(entry.exercise)
        self.date_var.set(entry.entry_date)
        self.unit_var.set(normalize_unit(entry.unit))
        if entry.notes:
            self.notes_text.insert("1.0", entry.notes)

    def _open_unit_manager(self) -> None:
        UnitManagerDialog(self, self.store, on_change=self._on_units_managed)

    def _on_units_managed(self, **kwargs) -> None:
        if new_unit := kwargs.get("new_unit"):
            self.unit_var.set(new_unit)
        elif deleted_unit := kwargs.get("deleted_unit"):
            if self.unit_var.get() == deleted_unit:
                self.unit_var.set("")
        self._refresh_dropdowns()

    def _refresh_dropdowns(self, **_kwargs) -> None:
        self.exercise_combo["values"] = self.store.dropdown_names()
        self.unit_combo["values"] = self.store.dropdown_units()
        self.set_rows.refresh_labels()

    def _save(self) -> None:
        exercise = normalize_exercise_name(self.exercise_var.get())
        if not exercise:
            messagebox.showwarning("Missing name", "Type a name to track.", parent=self)
            return

        entry_date = self.date_var.get().strip()
        try:
            date.fromisoformat(entry_date)
        except ValueError:
            messagebox.showwarning("Invalid date", "Use YYYY-MM-DD format.", parent=self)
            return

        try:
            set_labels, set_values = self.set_rows.parse()
        except ValueError as exc:
            messagebox.showwarning("Invalid values", str(exc), parent=self)
            return

        if not set_values:
            messagebox.showwarning("No values", "Enter at least one value.", parent=self)
            return

        unit = normalize_unit(self.unit_var.get())
        if not unit:
            messagebox.showwarning("Missing unit", "Type a unit (e.g. lbs, kcal, min).", parent=self)
            return

        notes = self.notes_text.get("1.0", tk.END).strip()
        updated = TrackEntry(
            exercise=exercise,
            entry_date=entry_date,
            set_values=set_values,
            set_labels=set_labels,
            notes=notes,
            logged_at=self.original_entry.logged_at,
            unit=unit,
        )
        self.store.update(self.entry_index, updated)
        self.on_saved()
        self.destroy()
