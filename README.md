# Fitness Tracker

A desktop GUI app to log anything you want to track and view progress over time with charts.

## Features

- Log any name (Body Weight, Pushups, Running, cardio, etc.)
- Add as many sets as you need — each set accepts reps, minutes, miles, pounds, or any number
- View workout history and delete entries
- Progress charts per name showing total volume across dates

**Volume** is the sum of all set values for a session. For example, 3 sets of 10 pushups = volume 30. For cardio, one set of 30 minutes = volume 30.

## Setup

```bash
pip install -r requirements.txt
```

## Run

```bash
python main.py
```

Data is saved automatically to `workout_data.json` next to the app (or next to the `.exe`).

## Build executable (Windows)

```bash
pip install -r requirements.txt
python build_exe.py
```

The executable is created at `dist/FitnessTracker.exe`.
