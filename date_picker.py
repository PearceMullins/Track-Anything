"""Dark-themed calendar date picker popup."""

from __future__ import annotations

import calendar
import tkinter as tk
from datetime import date
from tkinter import ttk

from theme import COLORS, style_calendar_widget


class CalendarPopup(tk.Toplevel):
    def __init__(self, parent: tk.Widget, initial: date, on_select) -> None:
        super().__init__(parent)
        self.on_select = on_select
        self._year = initial.year
        self._month = initial.month
        self._selected = initial

        self.title("Select Date")
        self.configure(bg=COLORS["bg"])
        self.resizable(False, False)
        self.transient(parent.winfo_toplevel())
        self.grab_set()

        self._build()
        self._render_month()
        self._position_near(parent)

    def _position_near(self, widget: tk.Widget) -> None:
        self.update_idletasks()
        x = widget.winfo_rootx()
        y = widget.winfo_rooty() + widget.winfo_height() + 4
        self.geometry(f"+{x}+{y}")

    def _build(self) -> None:
        outer = tk.Frame(self, bg=COLORS["bg"], padx=12, pady=12)
        outer.pack(fill=tk.BOTH, expand=True)

        nav = tk.Frame(outer, bg=COLORS["bg"])
        nav.pack(fill=tk.X, pady=(0, 8))

        self._month_label = tk.Label(
            nav,
            bg=COLORS["bg"],
            fg=COLORS["fg"],
            font=("Segoe UI", 11, "bold"),
        )
        self._month_label.pack(side=tk.LEFT, expand=True)

        ttk.Button(nav, text="<", width=3, command=self._prev_month).pack(side=tk.LEFT)
        ttk.Button(nav, text=">", width=3, command=self._next_month).pack(side=tk.RIGHT)

        weekdays = tk.Frame(outer, bg=COLORS["bg"])
        weekdays.pack(fill=tk.X)
        for name in ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"):
            tk.Label(
                weekdays,
                text=name,
                width=4,
                bg=COLORS["bg"],
                fg=COLORS["fg_muted"],
                font=("Segoe UI", 9, "bold"),
            ).pack(side=tk.LEFT, padx=1)

        self._days_frame = tk.Frame(outer, bg=COLORS["bg"])
        self._days_frame.pack(pady=(4, 8))

        ttk.Button(outer, text="Today", command=self._pick_today).pack(fill=tk.X)

    def _prev_month(self) -> None:
        if self._month == 1:
            self._month = 12
            self._year -= 1
        else:
            self._month -= 1
        self._render_month()

    def _next_month(self) -> None:
        if self._month == 12:
            self._month = 1
            self._year += 1
        else:
            self._month += 1
        self._render_month()

    def _pick_today(self) -> None:
        self._choose(date.today())

    def _choose(self, picked: date) -> None:
        self.on_select(picked)
        self.destroy()

    def _render_month(self) -> None:
        for child in self._days_frame.winfo_children():
            child.destroy()

        self._month_label.config(text=date(self._year, self._month, 1).strftime("%B %Y"))
        weeks = calendar.monthcalendar(self._year, self._month)

        for week in weeks:
            row = tk.Frame(self._days_frame, bg=COLORS["bg"])
            row.pack()
            for day in week:
                if day == 0:
                    tk.Label(row, text="", width=4, bg=COLORS["bg"]).pack(side=tk.LEFT, padx=1, pady=1)
                    continue
                picked = date(self._year, self._month, day)
                is_selected = picked == self._selected
                is_today = picked == date.today()
                btn = tk.Button(
                    row,
                    text=str(day),
                    width=3,
                    command=lambda d=picked: self._choose(d),
                )
                style_calendar_widget(btn)
                if is_selected:
                    btn.configure(bg=COLORS["accent"], activebackground=COLORS["accent"])
                elif is_today:
                    btn.configure(fg=COLORS["accent"])
                btn.pack(side=tk.LEFT, padx=1, pady=1)


class DatePicker(ttk.Frame):
    """Read-only date field with calendar popup."""

    def __init__(self, parent, date_var: tk.StringVar | None = None, **kwargs) -> None:
        super().__init__(parent, **kwargs)
        self.date_var = date_var or tk.StringVar()
        self._build()

    def _build(self) -> None:
        self.entry = ttk.Entry(self, textvariable=self.date_var, width=12, state="readonly")
        self.entry.pack(side=tk.LEFT)
        self.entry.bind("<Button-1>", lambda _e: self._open_calendar())

        ttk.Button(self, text="📅", width=3, command=self._open_calendar).pack(side=tk.LEFT, padx=(6, 0))

    def _parse_current(self) -> date:
        try:
            return date.fromisoformat(self.date_var.get().strip())
        except ValueError:
            return date.today()

    def _open_calendar(self) -> None:
        CalendarPopup(self.entry, self._parse_current(), on_select=self._on_select)

    def _on_select(self, picked: date) -> None:
        self.date_var.set(picked.isoformat())
