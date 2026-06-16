"""Build standalone Windows executable with PyInstaller."""

import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST_FRONTEND = ROOT / "frontend" / "dist"
ICON_CANDIDATES = (
    ROOT / "assets" / "Track Anything Icon.ico",
    ROOT / "assets" / "app.ico",
)
EXE_NAME = "TrackAnything"


def resolve_icon() -> Path | None:
    for candidate in ICON_CANDIDATES:
        if candidate.exists():
            return candidate
    return None


def build(*, onefile: bool = True) -> None:
    if not DIST_FRONTEND.exists():
        print("Building React frontend first...")
        subprocess.check_call(["npm", "install"], cwd=ROOT / "frontend", shell=True)
        subprocess.check_call(["npm", "run", "build"], cwd=ROOT / "frontend", shell=True)

    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",
        "--windowed",
        "--name",
        EXE_NAME,
        "--distpath",
        str(ROOT / "dist"),
        "--workpath",
        str(ROOT / "build"),
        "--specpath",
        str(ROOT),
        "--add-data",
        f"{DIST_FRONTEND}{os.pathsep}frontend/dist",
        "--hidden-import",
        "uvicorn.logging",
        "--hidden-import",
        "uvicorn.loops.auto",
        "--hidden-import",
        "uvicorn.protocols.http.auto",
        "--hidden-import",
        "uvicorn.lifespan.on",
        "main.py",
    ]
    if onefile:
        cmd.insert(5, "--onefile")
    else:
        cmd.insert(5, "--onedir")

    icon = resolve_icon()
    if icon is not None:
        cmd.extend(["--icon", str(icon)])

    print("Running:", " ".join(cmd))
    subprocess.check_call(cmd, cwd=ROOT)

    if onefile:
        print(f"\nDesktop app ready: {ROOT / 'dist' / f'{EXE_NAME}.exe'}")
    else:
        print(f"\nDesktop app folder ready: {ROOT / 'dist' / EXE_NAME}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Package Track Anything for desktop distribution.")
    parser.add_argument(
        "--folder",
        action="store_true",
        help="Build a folder bundle instead of a single .exe.",
    )
    args = parser.parse_args()
    build(onefile=not args.folder)


if __name__ == "__main__":
    main()
