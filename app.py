"""Main Track Anything application window."""

import tkinter as tk
from tkinter import ttk

from charts_panel import ChartsPanel
from data_store import TrackStore
from entry_panel import EntryPanel
from history_panel import HistoryPanel
from models import TrackEntry
from theme import apply_dark_theme, make_scrollable


class TrackAnythingApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Track Anything")
        self.geometry("820x680")
        self.minsize(680, 520)

        self.store = TrackStore()
        self._apply_theme()
        self._build_ui()

    def _apply_theme(self) -> None:
        apply_dark_theme(self)

    def _build_ui(self) -> None:
        header = ttk.Frame(self, padding=(16, 14, 16, 6))
        header.pack(fill=tk.X)

        title_block = ttk.Frame(header)
        title_block.pack(side=tk.LEFT)
        ttk.Label(title_block, text="Track Anything", style="Title.TLabel").pack(anchor=tk.W)
        ttk.Label(
            title_block,
            text="Log anything, review history, and see your progress over time.",
            style="Subtitle.TLabel",
        ).pack(anchor=tk.W, pady=(2, 0))

        ttk.Separator(self, orient=tk.HORIZONTAL).pack(fill=tk.X, padx=16)

        notebook = ttk.Notebook(self, padding=4)
        notebook.pack(fill=tk.BOTH, expand=True, padx=12, pady=(4, 0))

        log_tab = ttk.Frame(notebook)
        charts_tab = ttk.Frame(notebook)
        notebook.add(log_tab, text="  Log Entry  ")
        notebook.add(charts_tab, text="  Progress Charts  ")

        log_canvas, log_inner = make_scrollable(log_tab)
        log_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        log_scroll = ttk.Scrollbar(log_tab, orient=tk.VERTICAL, command=log_canvas.yview)
        log_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        log_canvas.configure(yscrollcommand=log_scroll.set)

        log_inner.grid_columnconfigure(0, weight=1)

        self.entry_panel = EntryPanel(
            log_inner,
            self.store,
            on_save=self._on_entry_saved,
            on_names_changed=self._on_data_changed,
        )
        self.entry_panel.grid(row=0, column=0, sticky="ew")

        self.history_panel = HistoryPanel(log_inner, self.store, on_change=self._on_data_changed)
        self.history_panel.grid(row=1, column=0, sticky="ew", pady=(0, 8))

        self.charts_panel = ChartsPanel(charts_tab, self.store)
        self.charts_panel.pack(fill=tk.BOTH, expand=True)
        self.charts_panel.refresh_exercises()

        notebook.bind("<<NotebookTabChanged>>", self._on_tab_changed)

        footer = ttk.Frame(self, padding=(16, 8))
        footer.pack(side=tk.BOTTOM, fill=tk.X)
        ttk.Label(
            footer,
            text="Volume is the sum of row values. Type any names, labels, and units you need.",
            style="Muted.TLabel",
        ).pack()

    def _on_entry_saved(self, entry: TrackEntry) -> None:
        self.store.add(entry)
        self.history_panel.refresh()
        self._on_data_changed()

    def _on_data_changed(self) -> None:
        self.entry_panel.refresh_exercises()
        self.history_panel.refresh()
        self.charts_panel.refresh_exercises()

    def _on_tab_changed(self, event: tk.Event) -> None:
        if event.widget.index("current") == 1:
            self.charts_panel.refresh_charts()


def run_app() -> None:
    app = TrackAnythingApp()
    app.mainloop()
