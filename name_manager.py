"""Dialog for editing and deleting tracked names."""

import tkinter as tk
from tkinter import messagebox, simpledialog, ttk

from data_store import WorkoutStore
from models import normalize_exercise_name
from theme import COLORS, apply_dark_theme


class NameManagerDialog(tk.Toplevel):
    def __init__(self, parent: tk.Widget, store: WorkoutStore, on_change) -> None:
        super().__init__(parent)
        self.store = store
        self.on_change = on_change

        self.title("Manage Names")
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
        px = parent.winfo_rootx() + 40
        py = parent.winfo_rooty() + 40
        self.geometry(f"+{px}+{py}")

    def _build(self) -> None:
        outer = ttk.Frame(self, padding=12)
        outer.pack(fill=tk.BOTH, expand=True)

        ttk.Label(
            outer,
            text="Edit or remove names from the dropdown.",
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
        for name in self.store.dropdown_names():
            self._listbox.insert(tk.END, name)

    def _selected_name(self) -> str | None:
        selection = self._listbox.curselection()
        if not selection:
            return None
        return self._listbox.get(selection[0])

    def _edit_selected(self) -> None:
        old_name = self._selected_name()
        if not old_name:
            messagebox.showinfo("Edit Name", "Select a name to edit.", parent=self)
            return

        new_name = simpledialog.askstring(
            "Edit Name",
            f"Rename '{old_name}' to:",
            initialvalue=old_name,
            parent=self,
        )
        if not new_name:
            return

        new_name = normalize_exercise_name(new_name)
        if not new_name:
            messagebox.showwarning("Invalid Name", "Name cannot be empty.", parent=self)
            return

        if new_name == old_name:
            return

        if new_name in self.store.dropdown_names():
            messagebox.showwarning(
                "Duplicate Name",
                f"'{new_name}' already exists in the dropdown.",
                parent=self,
            )
            return

        try:
            self.store.rename_name(old_name, new_name)
        except ValueError as exc:
            messagebox.showwarning("Edit Failed", str(exc), parent=self)
            return

        self._refresh_list()
        self.on_change(old_name=old_name, new_name=new_name)

    def _delete_selected(self) -> None:
        name = self._selected_name()
        if not name:
            messagebox.showinfo("Delete Name", "Select a name to delete.", parent=self)
            return

        entry_count = len(self.store.entries_for_exercise(name))
        if entry_count:
            msg = (
                f"Delete '{name}' from the dropdown and remove all {entry_count} "
                f"saved record(s) for it?"
            )
        else:
            msg = f"Remove '{name}' from the dropdown?"

        if not messagebox.askyesno("Delete Name", msg, parent=self):
            return

        deleted = self.store.remove_name(name)
        self._refresh_list()
        self.on_change(deleted_name=name, deleted_count=deleted)
