"""Flatten repository history to one descriptive commit per file."""

from __future__ import annotations

import subprocess
from pathlib import Path

from relabel_file_commits import message_for

ROOT = Path(__file__).resolve().parent.parent


def run(*args: str, check: bool = True) -> str:
    result = subprocess.run(
        args,
        cwd=ROOT,
        check=check,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def main() -> None:
    source = run("git", "rev-parse", "HEAD")
    tree = run("git", "rev-parse", f"{source}^{{tree}}")
    files = run("git", "ls-tree", "-r", "--name-only", tree).splitlines()

    run("git", "checkout", "--orphan", "flatten-temp")
    run("git", "rm", "-rf", ".", check=False)

    for path in files:
        run("git", "checkout", tree, "--", path)
        run("git", "add", "--", path)
        run("git", "commit", "-m", message_for(path))

    run("git", "branch", "-M", "main")
    print(f"Flattened {len(files)} files. HEAD:", run("git", "rev-parse", "--short", "HEAD"))


if __name__ == "__main__":
    main()
