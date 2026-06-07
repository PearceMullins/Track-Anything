"""Dark theme colors and ttk styling for Fitness Tracker."""

from __future__ import annotations

import tkinter as tk
from tkinter import ttk
from typing import Any

COLORS: dict[str, str] = {
    "bg": "#1a1a26",
    "bg_secondary": "#242436",
    "bg_elevated": "#2e2e44",
    "fg": "#e8e8f2",
    "fg_muted": "#9a9ab0",
    "accent": "#7c9eff",
    "accent_soft": "#3d4f7c",
    "border": "#3a3a52",
    "input_bg": "#2a2a3e",
    "danger": "#e06c75",
    "success": "#98c379",
}


def apply_dark_theme(root: tk.Tk | tk.Toplevel) -> ttk.Style:
    style = ttk.Style(root)
    if "clam" in style.theme_names():
        style.theme_use("clam")

    c = COLORS
    root.configure(bg=c["bg"])

    style.configure(".", background=c["bg"], foreground=c["fg"])
    style.configure("TFrame", background=c["bg"])
    style.configure("TLabel", background=c["bg"], foreground=c["fg"])
    style.configure(
        "Muted.TLabel",
        background=c["bg"],
        foreground=c["fg_muted"],
    )
    style.configure(
        "TLabelFrame",
        background=c["bg"],
        foreground=c["fg"],
        bordercolor=c["border"],
        relief="solid",
    )
    style.configure("TLabelFrame.Label", background=c["bg"], foreground=c["accent"])

    style.configure(
        "TButton",
        background=c["bg_elevated"],
        foreground=c["fg"],
        bordercolor=c["border"],
        focusthickness=0,
        padding=(10, 6),
    )
    style.map(
        "TButton",
        background=[("active", c["accent_soft"]), ("pressed", c["accent"])],
        foreground=[("pressed", c["fg"])],
    )
    style.configure(
        "Accent.TButton",
        background=c["accent_soft"],
        foreground=c["fg"],
    )
    style.map(
        "Accent.TButton",
        background=[("active", c["accent"]), ("pressed", c["accent"])],
    )

    style.configure(
        "TEntry",
        fieldbackground=c["input_bg"],
        foreground=c["fg"],
        insertcolor=c["fg"],
        bordercolor=c["border"],
    )
    style.configure(
        "TNotebook",
        background=c["bg"],
        bordercolor=c["border"],
        tabmargins=(4, 4, 4, 0),
    )
    style.configure(
        "TNotebook.Tab",
        background=c["bg_secondary"],
        foreground=c["fg_muted"],
        padding=(14, 8),
        bordercolor=c["border"],
    )
    style.map(
        "TNotebook.Tab",
        background=[("selected", c["bg_elevated"])],
        foreground=[("selected", c["accent"])],
    )

    style.configure(
        "Treeview",
        background=c["input_bg"],
        foreground=c["fg"],
        fieldbackground=c["input_bg"],
        bordercolor=c["border"],
        rowheight=26,
    )
    style.configure(
        "Treeview.Heading",
        background=c["bg_elevated"],
        foreground=c["fg"],
        bordercolor=c["border"],
        relief="flat",
    )
    style.map(
        "Treeview",
        background=[("selected", c["accent_soft"])],
        foreground=[("selected", c["fg"])],
    )

    style.configure(
        "TCombobox",
        fieldbackground=c["input_bg"],
        foreground=c["fg"],
        background=c["bg_elevated"],
        arrowcolor=c["fg"],
        bordercolor=c["border"],
    )
    style.map(
        "TCombobox",
        fieldbackground=[("readonly", c["input_bg"])],
        foreground=[("readonly", c["fg"])],
    )

    style.configure(
        "Vertical.TScrollbar",
        background=c["bg_elevated"],
        troughcolor=c["bg_secondary"],
        bordercolor=c["border"],
        arrowcolor=c["fg"],
    )
    style.map(
        "Vertical.TScrollbar",
        background=[("active", c["accent_soft"])],
    )

    return style


def style_text_widget(widget: tk.Text, **extra: Any) -> None:
    c = COLORS
    widget.configure(
        bg=c["input_bg"],
        fg=c["fg"],
        insertbackground=c["fg"],
        selectbackground=c["accent_soft"],
        selectforeground=c["fg"],
        relief=tk.FLAT,
        highlightthickness=1,
        highlightbackground=c["border"],
        highlightcolor=c["accent"],
        **extra,
    )


def style_calendar_widget(widget: tk.Widget) -> None:
    c = COLORS
    widget.configure(
        bg=c["bg_elevated"],
        fg=c["fg"],
        activebackground=c["accent_soft"],
        activeforeground=c["fg"],
        highlightthickness=0,
        bd=0,
    )
