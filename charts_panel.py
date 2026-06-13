"""Multi-chart progress panel with selectable names."""

import tkinter as tk
from tkinter import ttk

from charts import create_volume_figure, embed_figure
from data_store import WorkoutStore
from theme import COLORS


class ChartsPanel(ttk.Frame):
    def __init__(self, parent, store: WorkoutStore) -> None:
        super().__init__(parent)
        self.store = store
        self._check_vars: dict[str, tk.BooleanVar] = {}
        self._canvases: list = []
        self._build()
        self.refresh_exercises()

    def _build(self) -> None:
        toolbar = ttk.Frame(self)
        toolbar.pack(fill=tk.X, padx=12, pady=(10, 6))

        ttk.Label(toolbar, text="Charts to display", style="Heading.TLabel").pack(side=tk.LEFT)
        ttk.Button(toolbar, text="Select All", style="Ghost.TButton", command=self._select_all).pack(
            side=tk.LEFT, padx=(16, 4)
        )
        ttk.Button(toolbar, text="Clear All", style="Ghost.TButton", command=self._clear_all).pack(side=tk.LEFT, padx=4)
        ttk.Button(toolbar, text="Refresh", style="Ghost.TButton", command=self.refresh_charts).pack(side=tk.LEFT, padx=4)

        checks_outer = ttk.LabelFrame(self, text="  Names  ", style="Card.TLabelframe", padding=12)
        checks_outer.pack(fill=tk.X, padx=12, pady=4)

        self._checks_inner = ttk.Frame(checks_outer, style="Card.TFrame")
        self._checks_inner.pack(fill=tk.X)

        charts_outer = ttk.Frame(self)
        charts_outer.pack(fill=tk.BOTH, expand=True, padx=12, pady=(4, 10))

        self._charts_canvas = tk.Canvas(charts_outer, highlightthickness=0, bg=COLORS["bg"])
        scroll = ttk.Scrollbar(charts_outer, orient=tk.VERTICAL, command=self._charts_canvas.yview)
        self._charts_canvas.configure(yscrollcommand=scroll.set)
        scroll.pack(side=tk.RIGHT, fill=tk.Y)
        self._charts_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self._charts_inner = ttk.Frame(self._charts_canvas)
        self._charts_window = self._charts_canvas.create_window((0, 0), window=self._charts_inner, anchor=tk.NW)
        self._charts_inner.bind("<Configure>", self._on_charts_configure)
        self._charts_canvas.bind("<Configure>", self._on_canvas_configure)
        self._charts_canvas.bind("<Enter>", self._bind_mousewheel)
        self._charts_canvas.bind("<Leave>", self._unbind_mousewheel)

    def _on_charts_configure(self, _event: tk.Event) -> None:
        self._charts_canvas.configure(scrollregion=self._charts_canvas.bbox("all"))

    def _on_canvas_configure(self, event: tk.Event) -> None:
        self._charts_canvas.itemconfig(self._charts_window, width=event.width)

    def _bind_mousewheel(self, _event: tk.Event) -> None:
        self._charts_canvas.bind_all("<MouseWheel>", self._on_mousewheel)

    def _unbind_mousewheel(self, _event: tk.Event) -> None:
        self._charts_canvas.unbind_all("<MouseWheel>")

    def _on_mousewheel(self, event: tk.Event) -> None:
        self._charts_canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

    def _select_all(self) -> None:
        for var in self._check_vars.values():
            var.set(True)
        self.refresh_charts()

    def _clear_all(self) -> None:
        for var in self._check_vars.values():
            var.set(False)
        self.refresh_charts()

    def _selected_names(self) -> list[str]:
        return sorted((name for name, var in self._check_vars.items() if var.get()), key=str.lower)

    def refresh_exercises(self) -> None:
        names = self.store.exercise_names()
        previous = {name: var.get() for name, var in self._check_vars.items()}

        for child in self._checks_inner.winfo_children():
            child.destroy()
        self._check_vars.clear()

        if not names:
            ttk.Label(self._checks_inner, text="No tracked names yet.", style="CardMuted.TLabel").pack(anchor=tk.W)
        else:
            for name in names:
                var = tk.BooleanVar(value=previous.get(name, True))
                self._check_vars[name] = var
                ttk.Checkbutton(
                    self._checks_inner,
                    text=name,
                    variable=var,
                    command=self.refresh_charts,
                    style="TCheckbutton",
                ).pack(anchor=tk.W, pady=2)

        self.refresh_charts()

    def refresh_charts(self) -> None:
        for canvas in self._canvases:
            canvas.get_tk_widget().destroy()
        self._canvases.clear()

        for child in self._charts_inner.winfo_children():
            child.destroy()

        selected = self._selected_names()
        if not selected:
            ttk.Label(
                self._charts_inner,
                text="Select one or more names above to view charts.",
                style="Muted.TLabel",
            ).pack(pady=40)
            return

        multi = len(selected) > 1
        figsize = (7, 2.75) if multi else (7, 4)

        for name in selected:
            fig = create_volume_figure(self.store, name, figsize=figsize)
            card = ttk.LabelFrame(self._charts_inner, text=f"  {name}  ", style="Card.TLabelframe", padding=8)
            card.pack(fill=tk.X, pady=(0, 12))

            if fig is None:
                ttk.Label(card, text=f"No data yet for {name}.", style="CardMuted.TLabel").pack(pady=8)
                continue

            canvas = embed_figure(card, fig)
            canvas.get_tk_widget().pack(fill=tk.X)
            self._canvases.append(canvas)

        self._on_charts_configure(None)
