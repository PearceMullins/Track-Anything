"""Entry history list with edit and delete actions."""

import tkinter as tk
from tkinter import messagebox, ttk

from data_store import TrackStore
from history_edit_dialog import HistoryEditDialog
from models import normalize_unit


class HistoryPanel(ttk.Frame):
    def __init__(self, parent, store: TrackStore, on_change) -> None:
        super().__init__(parent)
        self.store = store
        self.on_change = on_change
        self._build()
        self.refresh()

    def _build(self) -> None:
        card = ttk.LabelFrame(self, text="  History  ", style="Card.TLabelframe", padding=12)
        card.pack(fill=tk.X, padx=12, pady=(0, 4))

        header = ttk.Frame(card, style="Card.TFrame")
        header.pack(fill=tk.X, pady=(0, 8))

        ttk.Label(header, text="Recent entries", style="CardMuted.TLabel").pack(side=tk.LEFT)

        header_btns = ttk.Frame(header, style="Card.TFrame")
        header_btns.pack(side=tk.RIGHT)
        ttk.Button(header_btns, text="Edit", style="Ghost.TButton", command=self._edit_selected).pack(
            side=tk.LEFT, padx=(0, 6)
        )
        ttk.Button(header_btns, text="Delete", style="Ghost.TButton", command=self._delete_selected).pack(
            side=tk.LEFT, padx=(0, 6)
        )
        ttk.Button(header_btns, text="Refresh", style="Ghost.TButton", command=self.refresh).pack(side=tk.LEFT)

        table_frame = ttk.Frame(card, style="Card.TFrame")
        table_frame.pack(fill=tk.X)

        columns = ("date", "exercise", "unit", "sets", "volume", "detail")
        self.tree = ttk.Treeview(table_frame, columns=columns, show="headings", height=3)
        self.tree.heading("date", text="Date")
        self.tree.heading("exercise", text="Name")
        self.tree.heading("unit", text="Unit")
        self.tree.heading("sets", text="Rows")
        self.tree.heading("volume", text="Volume")
        self.tree.heading("detail", text="Details")

        self.tree.column("date", width=95, anchor=tk.CENTER, stretch=False)
        self.tree.column("exercise", width=130, stretch=False)
        self.tree.column("unit", width=60, anchor=tk.CENTER, stretch=False)
        self.tree.column("sets", width=45, anchor=tk.CENTER, stretch=False)
        self.tree.column("volume", width=90, anchor=tk.CENTER, stretch=False)
        self.tree.column("detail", width=240, stretch=True)

        scroll = ttk.Scrollbar(table_frame, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscrollcommand=scroll.set)
        self.tree.pack(side=tk.LEFT, fill=tk.X, expand=True)
        scroll.pack(side=tk.RIGHT, fill=tk.Y)

        self.tree.bind("<Double-1>", self._on_double_click)

    def refresh(self) -> None:
        for item in self.tree.get_children():
            self.tree.delete(item)

        entry_count = len(self.store.entries)
        visible_rows = min(max(entry_count, 3), 12)
        self.tree.configure(height=visible_rows)

        for i, entry in enumerate(self.store.entries):
            self.tree.insert(
                "",
                tk.END,
                iid=str(i),
                values=(
                    entry.entry_date,
                    entry.exercise,
                    normalize_unit(entry.unit) or "—",
                    entry.set_count,
                    entry.formatted_volume,
                    entry.formatted_sets,
                ),
            )

    def _on_double_click(self, _event: tk.Event) -> None:
        self._edit_selected()

    def _edit_selected(self) -> None:
        selected = self.tree.selection()
        if not selected:
            messagebox.showinfo("Edit", "Select an entry to edit.")
            return
        if len(selected) > 1:
            messagebox.showinfo("Edit", "Select only one entry to edit at a time.")
            return

        index = int(selected[0])
        entry = self.store.entries[index]
        summary = f"{entry.entry_date} — {entry.exercise} ({entry.formatted_volume})"
        if not messagebox.askyesno("Confirm Edit", f"Edit this entry?\n\n{summary}"):
            return

        HistoryEditDialog(
            self,
            self.store,
            index,
            entry,
            on_saved=self._on_entry_saved,
        )

    def _on_entry_saved(self) -> None:
        self.refresh()
        self.on_change()

    def _delete_selected(self) -> None:
        selected = self.tree.selection()
        if not selected:
            messagebox.showinfo("Delete", "Select an entry to delete.")
            return
        if not messagebox.askyesno("Confirm", "Delete selected entry/entries?"):
            return
        indices = sorted((int(iid) for iid in selected), reverse=True)
        for index in indices:
            self.store.delete(index)
        self.refresh()
        self.on_change()
