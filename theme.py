"""Dark theme colors, fonts, and ttk styling for Track Anything."""

from __future__ import annotations

import tkinter as tk
from tkinter import ttk
from typing import Any

COLORS: dict[str, str] = {
    "bg": "#12121c",
    "bg_secondary": "#1a1a28",
    "bg_elevated": "#222233",
    "bg_card": "#1e1e2e",
    "fg": "#eef0f8",
    "fg_muted": "#8b8da3",
    "accent": "#6d9fff",
    "accent_hover": "#8ab4ff",
    "accent_soft": "#2a3f6e",
    "accent_glow": "#4a6ab0",
    "border": "#32324a",
    "border_soft": "#28283c",
    "input_bg": "#252538",
    "danger": "#f07178",
    "success": "#7fd99a",
}

FONTS = {
    "title": ("Segoe UI", 18, "bold"),
    "subtitle": ("Segoe UI", 10),
    "heading": ("Segoe UI", 11, "bold"),
    "body": ("Segoe UI", 10),
    "small": ("Segoe UI", 9),
    "button": ("Segoe UI", 10),
}


def apply_dark_theme(root: tk.Tk | tk.Toplevel) -> ttk.Style:
    style = ttk.Style(root)
    if "clam" in style.theme_names():
        style.theme_use("clam")

    c = COLORS
    root.configure(bg=c["bg"])

    style.configure(".", background=c["bg"], foreground=c["fg"], font=FONTS["body"])
    style.configure("TFrame", background=c["bg"])
    style.configure("Card.TFrame", background=c["bg_card"])
    style.configure("TLabel", background=c["bg"], foreground=c["fg"], font=FONTS["body"])
    style.configure("Card.TLabel", background=c["bg_card"], foreground=c["fg"], font=FONTS["body"])
    style.configure("Muted.TLabel", background=c["bg"], foreground=c["fg_muted"], font=FONTS["small"])
    style.configure("CardMuted.TLabel", background=c["bg_card"], foreground=c["fg_muted"], font=FONTS["small"])
    style.configure("Title.TLabel", background=c["bg"], foreground=c["fg"], font=FONTS["title"])
    style.configure("Subtitle.TLabel", background=c["bg"], foreground=c["fg_muted"], font=FONTS["subtitle"])
    style.configure("Heading.TLabel", background=c["bg"], foreground=c["fg"], font=FONTS["heading"])
    style.configure("CardHeading.TLabel", background=c["bg_card"], foreground=c["accent"], font=FONTS["heading"])

    style.configure(
        "TLabelFrame",
        background=c["bg_card"],
        foreground=c["fg"],
        bordercolor=c["border"],
        relief="flat",
        borderwidth=1,
    )
    style.configure("TLabelFrame.Label", background=c["bg_card"], foreground=c["accent"], font=FONTS["heading"])
    style.configure(
        "Card.TLabelframe",
        background=c["bg_card"],
        foreground=c["fg"],
        bordercolor=c["border"],
        relief="flat",
        borderwidth=1,
    )
    style.configure(
        "Card.TLabelframe.Label",
        background=c["bg_card"],
        foreground=c["accent"],
        font=FONTS["heading"],
    )

    style.configure(
        "TButton",
        background=c["bg_elevated"],
        foreground=c["fg"],
        bordercolor=c["border"],
        focusthickness=0,
        padding=(12, 7),
        font=FONTS["button"],
    )
    style.map(
        "TButton",
        background=[("active", c["accent_soft"]), ("pressed", c["accent_glow"])],
        foreground=[("pressed", c["fg"])],
        bordercolor=[("active", c["accent"])],
    )
    style.configure(
        "Accent.TButton",
        background=c["accent_soft"],
        foreground=c["fg"],
        bordercolor=c["accent_glow"],
        padding=(14, 8),
    )
    style.map(
        "Accent.TButton",
        background=[("active", c["accent"]), ("pressed", c["accent_hover"])],
        bordercolor=[("active", c["accent_hover"])],
    )
    style.configure(
        "Ghost.TButton",
        background=c["bg_card"],
        foreground=c["fg_muted"],
        bordercolor=c["border_soft"],
        padding=(10, 6),
    )
    style.map(
        "Ghost.TButton",
        background=[("active", c["bg_elevated"])],
        foreground=[("active", c["fg"])],
    )

    style.configure(
        "TEntry",
        fieldbackground=c["input_bg"],
        foreground=c["fg"],
        insertcolor=c["fg"],
        bordercolor=c["border"],
        padding=6,
    )
    style.configure(
        "TNotebook",
        background=c["bg"],
        bordercolor=c["border"],
        tabmargins=(2, 4, 2, 0),
    )
    style.configure(
        "TNotebook.Tab",
        background=c["bg_secondary"],
        foreground=c["fg_muted"],
        padding=(18, 10),
        bordercolor=c["border"],
        font=FONTS["button"],
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
        rowheight=30,
        font=FONTS["body"],
    )
    style.configure(
        "Treeview.Heading",
        background=c["bg_elevated"],
        foreground=c["fg_muted"],
        bordercolor=c["border"],
        relief="flat",
        font=("Segoe UI", 9, "bold"),
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
        arrowcolor=c["fg_muted"],
        bordercolor=c["border"],
        padding=6,
    )
    style.map(
        "TCombobox",
        fieldbackground=[("readonly", c["input_bg"])],
        foreground=[("readonly", c["fg"])],
        bordercolor=[("focus", c["accent"])],
    )

    style.configure(
        "TCheckbutton",
        background=c["bg_card"],
        foreground=c["fg"],
        font=FONTS["body"],
    )
    style.map(
        "TCheckbutton",
        background=[("active", c["bg_card"])],
        foreground=[("active", c["fg"])],
    )

    style.configure(
        "Vertical.TScrollbar",
        background=c["bg_elevated"],
        troughcolor=c["bg_secondary"],
        bordercolor=c["border"],
        arrowcolor=c["fg_muted"],
    )
    style.map("Vertical.TScrollbar", background=[("active", c["accent_soft"])])

    style.configure("TSeparator", background=c["border"])

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
        font=FONTS["body"],
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
        font=FONTS["body"],
    )


def make_scrollable(parent: tk.Widget) -> tuple[tk.Canvas, ttk.Frame]:
    """Return a canvas and inner frame for vertical scrolling."""
    canvas = tk.Canvas(parent, highlightthickness=0, bg=COLORS["bg"])
    scroll = ttk.Scrollbar(parent, orient=tk.VERTICAL, command=canvas.yview)
    canvas.configure(yscrollcommand=scroll.set)
    inner = ttk.Frame(canvas)
    window = canvas.create_window((0, 0), window=inner, anchor=tk.NW)

    def _on_configure(_event: tk.Event) -> None:
        canvas.configure(scrollregion=canvas.bbox("all"))

    def _on_canvas_configure(event: tk.Event) -> None:
        canvas.itemconfig(window, width=event.width)

    inner.bind("<Configure>", _on_configure)
    canvas.bind("<Configure>", _on_canvas_configure)
    return canvas, inner
