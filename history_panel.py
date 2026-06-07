"""Workout history list and delete actions."""

import tkinter as tk
from tkinter import messagebox, ttk

from data_store import WorkoutStore
from models import normalize_unit


class HistoryPanel(ttk.Frame):
    def __init__(self, parent, store: WorkoutStore, on_change) -> None:
        super().__init__(parent)
        self.store = store
        self.on_change = on_change
        self._build()
        self.refresh()

    def _build(self) -> None:
        header = ttk.Frame(self)
        header.pack(fill=tk.X, padx=8, pady=(8, 4))
        ttk.Label(header, text="Workout History", font=("", 11, "bold")).pack(side=tk.LEFT)
        ttk.Button(header, text="Refresh", command=self.refresh).pack(side=tk.RIGHT)

        columns = ("date", "exercise", "unit", "sets", "volume", "detail")
        self.tree = ttk.Treeview(self, columns=columns, show="headings", height=10)
        self.tree.heading("date", text="Date")
        self.tree.heading("exercise", text="Name")
        self.tree.heading("unit", text="Unit")
        self.tree.heading("sets", text="Sets")
        self.tree.heading("volume", text="Volume")
        self.tree.heading("detail", text="Set Values")

        self.tree.column("date", width=95, anchor=tk.CENTER)
        self.tree.column("exercise", width=120)
        self.tree.column("unit", width=55, anchor=tk.CENTER)
        self.tree.column("sets", width=45, anchor=tk.CENTER)
        self.tree.column("volume", width=85, anchor=tk.CENTER)
        self.tree.column("detail", width=200)

        scroll = ttk.Scrollbar(self, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscrollcommand=scroll.set)
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(8, 0), pady=(0, 8))
        scroll.pack(side=tk.RIGHT, fill=tk.Y, padx=(0, 8), pady=(0, 8))

        ttk.Button(self, text="Delete Selected", command=self._delete_selected).pack(
            anchor=tk.E, padx=8, pady=(0, 8)
        )

    def refresh(self) -> None:
        for item in self.tree.get_children():
            self.tree.delete(item)

        for i, entry in enumerate(self.store.entries):
            self.tree.insert(
                "",
                tk.END,
                iid=str(i),
                values=(
                    entry.workout_date,
                    entry.exercise,
                    normalize_unit(entry.unit) or "—",
                    entry.set_count,
                    entry.formatted_volume,
                    entry.formatted_sets,
                ),
            )

    def _delete_selected(self) -> None:
        selected = self.tree.selection()
        if not selected:
            messagebox.showinfo("Delete", "Select a workout to delete.")
            return
        if not messagebox.askyesno("Confirm", "Delete selected workout(s)?"):
            return
        indices = sorted((int(iid) for iid in selected), reverse=True)
        for index in indices:
            self.store.delete(index)
        self.refresh()
        self.on_change()
