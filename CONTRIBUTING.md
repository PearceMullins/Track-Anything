<p align="center">
  <a href="README.md">README</a>
  ·
  <a href="CONTRIBUTING.md"><strong>Contributing</strong></a>
  ·
  <a href="LICENSE">MIT license</a>
  ·
  <a href="PRIVACY.md">Privacy</a>
  ·
  <a href="SECURITY.md">Security</a>
</p>

# Contributing

Thanks for your interest in Track Anything.

## Before you start

1. Open an issue for larger changes so we can align on approach.
2. Run the full test suite before opening a pull request:

```powershell
.\scripts\run_all_tests.ps1
```

## Development setup

```powershell
pip install -r requirements.txt
cd frontend
npm install
```

Run the API and frontend in two terminals:

```powershell
# Terminal 1
python main.py --dev-frontend

# Terminal 2
cd frontend
npm run dev
```

Open `http://localhost:5173`.

## Pull requests

- Keep changes focused and easy to review.
- Match existing code style and naming.
- Update docs when behavior or setup steps change.
- Do not commit local data files (`track_anything_data.json`, `workout_data.json`).

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities privately.
