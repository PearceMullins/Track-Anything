"""Build a standalone Windows executable with PyInstaller."""

import subprocess
import sys


def main() -> None:
    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--onefile",
        "--windowed",
        "--name",
        "FitnessTracker",
        "--collect-all",
        "matplotlib",
        "--hidden-import",
        "matplotlib.backends.backend_tkagg",
        "main.py",
    ]
    print("Running:", " ".join(cmd))
    subprocess.check_call(cmd)
    print("\nBuild complete: dist/FitnessTracker.exe")


if __name__ == "__main__":
    main()
