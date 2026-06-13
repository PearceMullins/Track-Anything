"""Dialog for editing and removing units from the dropdown."""

import tkinter as tk
from tkinter import messagebox, simpledialog, ttk

from data_store import WorkoutStore
from models import normalize_unit
from theme import COLORS, apply_dark_theme


class UnitManagerDialog(tk.Toplevel):
    def __init__(self, parent: tk.Widget, store: WorkoutStore, on_change) -> None:
        super().__init__(parent)
        self.store = store
        self.on_change = on_change

        self.title("Manage Units")
        self.geometry("420x360")
        self.minsize(360, 300)
        self.transient(parent.winfo_toplevel())
        self.grab_set()
        apply_dark_theme(self)

        self._build()
        self._refresh_list()
        self._center_on(parent)

    def _center_on(self, parent: tk.Widget) -> None:
        self.update_idletasks()
        self.geometry(f"+{parent.winfo_rootx() + 40}+{parent.winfo_rooty() + 40}")

    def _build(self) -> None:
        outer = ttk.Frame(self, padding=12)
        outer.pack(fill=tk.BOTH, expand=True)

        ttk.Label(
            outer,
            text="Edit or remove units from the dropdown.",
            style="Muted.TLabel",
        ).pack(anchor=tk.W)

        list_frame = ttk.Frame(outer)
        list_frame.pack(fill=tk.BOTH, expand=True, pady=(8, 8))

        self._listbox = tk.Listbox(
            list_frame,
            height=12,
            bg=COLORS["input_bg"],
            fg=COLORS["fg"],
            selectbackground=COLORS["accent_soft"],
            selectforeground=COLORS["fg"],
            highlightthickness=1,
            highlightbackground=COLORS["border"],
            highlightcolor=COLORS["accent"],
            relief=tk.FLAT,
            activestyle="none",
        )
        scroll = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self._listbox.yview)
        self._listbox.configure(yscrollcommand=scroll.set)
        self._listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scroll.pack(side=tk.RIGHT, fill=tk.Y)

        btn_row = ttk.Frame(outer)
        btn_row.pack(fill=tk.X)

        ttk.Button(btn_row, text="Edit", command=self._edit_selected).pack(side=tk.LEFT)
        ttk.Button(btn_row, text="Delete", command=self._delete_selected).pack(side=tk.LEFT, padx=8)
        ttk.Button(btn_row, text="Close", command=self.destroy).pack(side=tk.RIGHT)

    def _refresh_list(self) -> None:
        self._listbox.delete(0, tk.END)
        for unit in self.store.dropdown_units():
            self._listbox.insert(tk.END, unit)

    def _selected_unit(self) -> str | None:
        selection = self._listbox.curselection()
        if not selection:
            return None
        return self._listbox.get(selection[0])

    def _edit_selected(self) -> None:
        old_unit = self._selected_unit()
        if not old_unit:
            messagebox.showinfo("Edit Unit", "Select a unit to edit.", parent=self)
            return

        new_unit = simpledialog.askstring(
            "Edit Unit",
            f"Rename '{old_unit}' to:",
            initialvalue=old_unit,
            parent=self,
        )
        if not new_unit:
            return

        new_unit = normalize_unit(new_unit)
        if not new_unit:
            messagebox.showwarning("Invalid Unit", "Unit cannot be empty.", parent=self)
            return
        if new_unit == old_unit:
            return
        if new_unit in self.store.dropdown_units():
            messagebox.showwarning(
                "Duplicate Unit",
                f"'{new_unit}' already exists in the dropdown.",
                parent=self,
            )
            return

        try:
            self.store.rename_unit(old_unit, new_unit)
        except ValueError as exc:
            messagebox.showwarning("Edit Failed", str(exc), parent=self)
            return

        self._refresh_list()
        self.on_change(old_unit=old_unit, new_unit=new_unit)

    def _delete_selected(self) -> None:
        unit = self._selected_unit()
        if not unit:
            messagebox.showinfo("Delete Unit", "Select a unit to delete.", parent=self)
            return

        used_count = sum(1 for entry in self.store.entries if normalize_unit(entry.unit) == unit)
        if used_count:
            msg = (
                f"Remove '{unit}' from the dropdown?\n\n"
                f"{used_count} saved record(s) will keep this unit."
            )
        else:
            msg = f"Remove '{unit}' from the dropdown?"

        if not messagebox.askyesno("Delete Unit", msg, parent=self):
            return

        self.store.remove_unit(unit)
        self._refresh_list()
        self.on_change(deleted_unit=unit)
