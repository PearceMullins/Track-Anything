"""Exercise volume charts panel."""

import tkinter as tk
from tkinter import ttk

from charts import create_volume_figure, embed_figure
from data_store import WorkoutStore


class ChartsPanel(ttk.Frame):
    def __init__(self, parent, store: WorkoutStore) -> None:
        super().__init__(parent)
        self.store = store
        self._canvas = None
        self._build()

    def _build(self) -> None:
        top = ttk.Frame(self)
        top.pack(fill=tk.X, padx=8, pady=8)

        ttk.Label(top, text="Name:", font=("", 10, "bold")).pack(side=tk.LEFT)
        self.exercise_var = tk.StringVar()
        self.combo = ttk.Combobox(top, textvariable=self.exercise_var, width=32, state="readonly")
        self.combo.pack(side=tk.LEFT, padx=8)
        self.combo.bind("<<ComboboxSelected>>", lambda _: self.refresh_chart())

        ttk.Button(top, text="Update Chart", command=self.refresh_chart).pack(side=tk.LEFT)

        self.chart_frame = ttk.Frame(self)
        self.chart_frame.pack(fill=tk.BOTH, expand=True, padx=8, pady=(0, 8))

        self._show_empty("Log workouts to see volume charts here.", muted=True)

    def _show_empty(self, message: str, muted: bool = False) -> None:
        for child in self.chart_frame.winfo_children():
            child.destroy()
        style = "Muted.TLabel" if muted else "TLabel"
        ttk.Label(self.chart_frame, text=message, font=("", 11), style=style).pack(expand=True)

    def refresh_exercises(self) -> None:
        names = self.store.exercise_names()
        self.combo["values"] = names
        if names:
            current = self.exercise_var.get()
            if current not in names:
                self.exercise_var.set(names[0])
        else:
            self.exercise_var.set("")
        self.refresh_chart()

    def refresh_chart(self) -> None:
        if self._canvas is not None:
            self._canvas.get_tk_widget().destroy()
            self._canvas = None

        for child in self.chart_frame.winfo_children():
            child.destroy()

        exercise = self.exercise_var.get().strip()
        if not exercise:
            self._show_empty("Log workouts to see volume charts here.", muted=True)
            return

        fig = create_volume_figure(self.store, exercise)
        if fig is None:
            self._show_empty(f"No data yet for {exercise}.", muted=True)
            return

        self._canvas = embed_figure(self.chart_frame, fig)
        self._canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)
