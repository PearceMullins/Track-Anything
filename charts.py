"""Matplotlib chart helpers for tracked volume over time."""

from datetime import datetime, timedelta

import matplotlib.dates as mdates
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure

from data_store import WorkoutStore
from theme import COLORS


def create_volume_figure(
    store: WorkoutStore,
    exercise: str,
    figsize: tuple[float, float] = (7, 4),
) -> Figure | None:
    points = store.history_points(exercise)
    if not points:
        return None

    dates = [dt for dt, _ in points]
    volumes = [vol for _, vol in points]
    x_values = mdates.date2num(dates)

    fig = Figure(figsize=figsize, dpi=100)
    fig.patch.set_facecolor(COLORS["bg_card"])
    ax = fig.add_subplot(111)
    ax.set_facecolor(COLORS["bg_secondary"])

    accent = COLORS["accent"]
    ax.plot(x_values, volumes, marker="o", linewidth=2.2, markersize=7, color=accent)

    ymin, ymax = _value_axis_limits(volumes)
    ax.set_ylim(ymin, ymax)
    ax.fill_between(x_values, ymin, volumes, alpha=0.18, color=accent)

    for x_val, vol in zip(x_values, volumes):
        ax.annotate(
            f"{vol:g}",
            (x_val, vol),
            textcoords="offset points",
            xytext=(0, 8),
            ha="center",
            fontsize=8,
            color=COLORS["fg"],
        )

    ax.set_title(f"{exercise} — Progress Over Time", color=COLORS["fg"], fontsize=12, pad=12)
    ax.set_xlabel("Date", color=COLORS["fg_muted"])
    ax.set_ylabel("Recorded Value", color=COLORS["fg_muted"])
    ax.tick_params(colors=COLORS["fg_muted"])
    ax.grid(True, alpha=0.18, color=COLORS["border"])

    for spine in ax.spines.values():
        spine.set_color(COLORS["border"])

    _set_date_axis(ax, dates)
    fig.tight_layout()
    return fig


def _value_axis_limits(values: list[float]) -> tuple[float, float]:
    min_v = min(values)
    max_v = max(values)
    span = max_v - min_v

    if span == 0:
        pad = max(abs(min_v) * 0.05, 1.0) if min_v != 0 else 1.0
    else:
        pad = max(span * 0.08, 1e-9)

    return min_v - pad, max_v + pad


def _set_date_axis(ax, dates: list[datetime]) -> None:
    min_d = min(dates)
    max_d = max(dates)
    span_days = (max_d.date() - min_d.date()).days

    if span_days == 0:
        pad = timedelta(days=1)
    elif span_days < 7:
        pad = timedelta(days=1)
    else:
        pad = timedelta(days=max(2, int(span_days * 0.08)))

    ax.set_xlim(
        mdates.date2num(min_d - pad),
        mdates.date2num(max_d + pad),
    )
    ax.xaxis_date()

    if span_days == 0:
        locator = mdates.HourLocator(interval=3)
        formatter = mdates.DateFormatter("%b %d, %Y")
    elif span_days <= 14:
        locator = mdates.DayLocator()
        formatter = mdates.DateFormatter("%b %d, %Y")
    elif span_days <= 120:
        locator = mdates.WeekdayLocator(interval=1)
        formatter = mdates.DateFormatter("%b %d, %Y")
    else:
        locator = mdates.MonthLocator()
        formatter = mdates.DateFormatter("%b %Y")

    ax.xaxis.set_major_locator(locator)
    ax.xaxis.set_major_formatter(formatter)

    fig = ax.get_figure()
    if fig is not None:
        fig.autofmt_xdate(rotation=30, ha="right")


def embed_figure(parent, fig: Figure) -> FigureCanvasTkAgg:
    canvas = FigureCanvasTkAgg(fig, master=parent)
    canvas.draw()
    return canvas
