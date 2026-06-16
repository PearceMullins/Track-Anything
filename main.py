"""Launch Track Anything — API server and React UI."""

import argparse
import subprocess
import sys
import webbrowser
from pathlib import Path

import uvicorn

ROOT = Path(__file__).parent
DIST = ROOT / "frontend" / "dist"


def run_server(host: str = "127.0.0.1", port: int = 8000, open_browser: bool = True) -> None:
    if open_browser:
        webbrowser.open(f"http://{host}:{port}")
    uvicorn.run("api:app", host=host, port=port, reload=False)


def run_dev() -> None:
    if not DIST.exists():
        print("Building React frontend (first run)...")
        subprocess.check_call(["npm", "install"], cwd=ROOT / "frontend", shell=True)
        subprocess.check_call(["npm", "run", "build"], cwd=ROOT / "frontend", shell=True)
    run_server()


def main() -> None:
    parser = argparse.ArgumentParser(description="Track Anything")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument(
        "--dev-frontend",
        action="store_true",
        help="Only start API; run `npm run dev` in frontend/ separately.",
    )
    args = parser.parse_args()

    if args.dev_frontend:
        print(f"API: http://127.0.0.1:{args.port}")
        print("Frontend: cd frontend && npm run dev")
        uvicorn.run("api:app", host="127.0.0.1", port=args.port, reload=True)
        return

    if not DIST.exists():
        print("Frontend not built. Run: cd frontend && npm install && npm run build")
        print("Or: python main.py --dev-frontend  (with npm run dev in frontend/)")
        sys.exit(1)

    run_server(port=args.port, open_browser=not args.no_browser)


if __name__ == "__main__":
    main()
