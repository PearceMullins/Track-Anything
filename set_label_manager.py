"""Dialog for editing and removing set labels from the dropdown."""

import tkinter as tk
from tkinter import messagebox, simpledialog, ttk

from data_store import WorkoutStore
from models import normalize_set_label
from theme import COLORS, apply_dark_theme


class SetLabelManagerDialog(tk.Toplevel):
    def __init__(self, parent: tk.Widget, store: WorkoutStore, on_change) -> None:
        super().__init__(parent)
        self.store = store
        self.on_change = on_change

        self.title("Manage Set Labels")
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
            text="Edit or remove set labels from the dropdown.",
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
        for label in self.store.dropdown_set_labels():
            self._listbox.insert(tk.END, label)

    def _selected_label(self) -> str | None:
        selection = self._listbox.curselection()
        if not selection:
            return None
        return self._listbox.get(selection[0])

    def _edit_selected(self) -> None:
        old_label = self._selected_label()
        if not old_label:
            messagebox.showinfo("Edit Set Label", "Select a set label to edit.", parent=self)
            return

        new_label = simpledialog.askstring(
            "Edit Set Label",
            f"Rename '{old_label}' to:",
            initialvalue=old_label,
            parent=self,
        )
        if not new_label:
            return

        new_label = normalize_set_label(new_label)
        if not new_label:
            messagebox.showwarning("Invalid Label", "Set label cannot be empty.", parent=self)
            return
        if new_label == old_label:
            return
        if new_label in self.store.dropdown_set_labels():
            messagebox.showwarning(
                "Duplicate Label",
                f"'{new_label}' already exists in the dropdown.",
                parent=self,
            )
            return

        try:
            self.store.rename_set_label(old_label, new_label)
        except ValueError as exc:
            messagebox.showwarning("Edit Failed", str(exc), parent=self)
            return

        self._refresh_list()
        self.on_change(old_label=old_label, new_label=new_label)

    def _delete_selected(self) -> None:
        label = self._selected_label()
        if not label:
            messagebox.showinfo("Delete Set Label", "Select a set label to delete.", parent=self)
            return

        used_count = sum(
            1
            for entry in self.store.entries
            for entry_label in entry.set_labels
            if normalize_set_label(entry_label) == label
        )
        if used_count:
            msg = (
                f"Remove '{label}' from the dropdown?\n\n"
                f"{used_count} saved set(s) will keep this label."
            )
        else:
            msg = f"Remove '{label}' from the dropdown?"

        if not messagebox.askyesno("Delete Set Label", msg, parent=self):
            return

        self.store.remove_set_label(label)
        self._refresh_list()
        self.on_change(deleted_label=label)
