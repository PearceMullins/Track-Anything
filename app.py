"""Main Fitness Tracker application window."""

import tkinter as tk
from tkinter import ttk

from charts_panel import ChartsPanel
from data_store import WorkoutStore
from entry_panel import EntryPanel
from history_panel import HistoryPanel
from models import WorkoutEntry
from theme import apply_dark_theme


class FitnessTrackerApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Fitness Tracker")
        self.geometry("980x720")
        self.minsize(860, 640)

        self.store = WorkoutStore()
        self._apply_theme()
        self._build_ui()

    def _apply_theme(self) -> None:
        apply_dark_theme(self)

    def _build_ui(self) -> None:
        notebook = ttk.Notebook(self)
        notebook.pack(fill=tk.BOTH, expand=True, padx=6, pady=6)

        log_tab = ttk.Frame(notebook)
        charts_tab = ttk.Frame(notebook)
        notebook.add(log_tab, text="Log Workout")
        notebook.add(charts_tab, text="Progress Charts")

        self.entry_panel = EntryPanel(log_tab, self.store, on_save=self._on_workout_saved)
        self.entry_panel.pack(fill=tk.X)

        self.history_panel = HistoryPanel(log_tab, self.store, on_change=self._on_data_changed)
        self.history_panel.pack(fill=tk.BOTH, expand=True)

        self.charts_panel = ChartsPanel(charts_tab, self.store)
        self.charts_panel.pack(fill=tk.BOTH, expand=True)
        self.charts_panel.refresh_exercises()

        notebook.bind("<<NotebookTabChanged>>", self._on_tab_changed)

        footer = ttk.Label(
            self,
            text="Volume = sum of all set values. Choose a unit (reps, min, mi, lbs, etc.) when logging.",
            style="Muted.TLabel",
        )
        footer.pack(side=tk.BOTTOM, pady=4)

    def _on_workout_saved(self, entry: WorkoutEntry) -> None:
        self.store.add(entry)
        self.history_panel.refresh()
        self._on_data_changed()

    def _on_data_changed(self) -> None:
        self.entry_panel.refresh_exercises()
        self.charts_panel.refresh_exercises()

    def _on_tab_changed(self, event: tk.Event) -> None:
        if event.widget.index("current") == 1:
            self.charts_panel.refresh_chart()


def run_app() -> None:
    app = FitnessTrackerApp()
    app.mainloop()
