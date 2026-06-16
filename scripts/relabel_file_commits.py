"""Rewrite history so each file has a file-specific commit message on GitHub."""

from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# File-specific commit messages (professional, no legacy product naming).
MESSAGES: dict[str, str] = {
    ".github/workflows/ci.yml": "Add CI workflow for Python and frontend tests.",
    ".github/workflows/release.yml": "Add release workflow to publish Windows executable builds.",
    ".gitignore": "Update ignore rules for build output and local data files.",
    "CONTRIBUTING.md": "Add contributor setup and pull request guidelines.",
    "DONATIONS.md": "Document optional Google Play tip product configuration.",
    "GrokChat.md": "Remove obsolete assistant export notes.",
    "LICENSE": "Add MIT license.",
    "PLAY_STORE.md": "Add Google Play Console release checklist.",
    "README.md": "Add project overview, setup instructions, and download links.",
    "SECURITY.md": "Add security reporting policy.",
    "PRIVACY.md": "Add repository privacy policy with README-style header.",
    "api.py": "Add FastAPI endpoints for entries, profiles, and chart data.",
    "app.py": "Maintain legacy Tkinter desktop shell for reference builds.",
    "assets/Track Anything Icon.ico": "Add Windows executable icon asset.",
    "assets/app.ico": "Add application icon used in README and packaging.",
    "build_exe.py": "Add PyInstaller script for Windows desktop packaging.",
    "charts.py": "Add matplotlib chart rendering helpers for legacy UI.",
    "charts_panel.py": "Add legacy Tkinter charts panel.",
    "capacitor.config.ts": "Configure Capacitor app ID and web bundle path.",
    "data_store.py": "Add JSON persistence layer for tracked entries.",
    "date_picker.py": "Add calendar date picker widget for legacy entry forms.",
    "entry_panel.py": "Add legacy Tkinter entry form panel.",
    "history_edit_dialog.py": "Add legacy Tkinter dialog to edit history rows.",
    "history_panel.py": "Add legacy Tkinter history table panel.",
    "main.py": "Add desktop launcher for API server and built React UI.",
    "models.py": "Add TrackEntry data models and normalization helpers.",
    "name_manager.py": "Add legacy Tkinter dialog to manage tracked names.",
    "package-lock.json": "Lock Capacitor mobile wrapper dependencies.",
    "package.json": "Add Capacitor mobile wrapper package manifest.",
    "paths.py": "Add application and data file path helpers.",
    "profile_manager.py": "Add multi-profile storage and switching logic.",
    "requirements-dev.txt": "Add PyInstaller dependency for desktop builds.",
    "requirements.txt": "Add FastAPI backend runtime dependencies.",
    "set_label_manager.py": "Add legacy Tkinter dialog to manage set labels.",
    "set_rows.py": "Add legacy Tkinter labeled value row editor.",
    "theme.py": "Add shared dark theme styles for legacy Tkinter UI.",
    "unit_manager.py": "Add legacy Tkinter dialog to manage units.",
    "scripts/build_release.ps1": "Add PowerShell script to build release executable.",
    "scripts/run_all_tests.ps1": "Add PowerShell script to run backend and frontend tests.",
    "tests/conftest.py": "Add pytest fixtures for temporary data store paths.",
    "tests/test_api.py": "Add API endpoint integration tests.",
    "tests/test_data_store.py": "Add persistence and history chart tests.",
    "tests/test_models.py": "Add TrackEntry model and parsing tests.",
    "frontend/package-lock.json": "Lock React frontend dependencies.",
    "frontend/package.json": "Add React frontend package manifest.",
    "frontend/index.html": "Add frontend HTML shell and viewport metadata.",
    "frontend/.env.mobile": "Enable on-device storage mode for Android builds.",
    "frontend/tsconfig.json": "Add TypeScript compiler options for the frontend app.",
    "frontend/tsconfig.node.json": "Add TypeScript options for Vite tooling.",
    "frontend/vite.config.ts": "Configure Vite dev server and production build.",
    "frontend/vitest.config.ts": "Configure Vitest for frontend unit tests.",
    "frontend/src/main.tsx": "Add React application entry point.",
    "frontend/src/App.tsx": "Add main application layout and tab navigation.",
    "frontend/src/api.ts": "Add HTTP client for desktop API requests.",
    "frontend/src/types.ts": "Add shared TypeScript API response types.",
    "frontend/src/styles.css": "Add application layout and component styles.",
    "frontend/src/uiState.ts": "Add per-profile UI state persistence.",
    "frontend/src/viewportFix.ts": "Add mobile viewport height correction helper.",
    "frontend/src/snapshotBootstrap.ts": "Add chart snapshot bootstrap helper.",
    "frontend/src/labelPlaceholder.ts": "Add dynamic label placeholder helper.",
    "frontend/src/dateFormat.ts": "Add US-style date formatting helpers.",
    "frontend/src/dateFormat.test.ts": "Add tests for date formatting helpers.",
    "frontend/src/chartData.ts": "Add chart point aggregation for tracked names.",
    "frontend/src/chartData.test.ts": "Add tests for chart point aggregation.",
    "frontend/src/vite-env.d.ts": "Add Vite environment type declarations.",
    "frontend/src/components/EntryForm.tsx": "Add form to create new tracked entries.",
    "frontend/src/components/EditEntryModal.tsx": "Add modal to edit existing entries.",
    "frontend/src/components/HistoryPanel.tsx": "Add scrollable entry history table.",
    "frontend/src/components/ChartsPanel.tsx": "Add progress charts by tracked name.",
    "frontend/src/components/ProfileBar.tsx": "Add profile selector and management controls.",
    "frontend/src/components/ManageProfilesModal.tsx": "Add modal to rename and delete profiles.",
    "frontend/src/components/ManageListModal.tsx": "Add modal to manage dropdown list values.",
    "frontend/src/components/DeleteAllModal.tsx": "Add modal to delete all entries for a name.",
    "frontend/src/components/SuggestionInput.tsx": "Add autocomplete input with suggestions.",
    "frontend/src/components/ComboInput.tsx": "Add combobox input with custom values.",
    "frontend/src/components/DateInput.tsx": "Add date input with display formatting.",
    "frontend/src/components/SupportModal.tsx": "Add optional Google Play tips dialog.",
    "frontend/src/data/models.ts": "Add client-side TrackEntry models and suggestions.",
    "frontend/src/data/store.ts": "Add local storage-backed entry store.",
    "frontend/src/data/bootstrap.ts": "Add bootstrap payload builder for local API.",
    "frontend/src/data/localApi.ts": "Add offline API shim for Android builds.",
    "frontend/src/data/localApi.test.ts": "Add tests for offline API entry flows.",
    "frontend/src/data/profileManager.ts": "Add client-side multi-profile storage manager.",
    "frontend/src/data/profileNames.ts": "Add profile name normalization helper.",
    "frontend/src/data/config.ts": "Add local-mode detection for Capacitor builds.",
    "frontend/src/donations/config.ts": "Add Google Play tip product identifiers.",
    "frontend/src/donations/tipsService.ts": "Add Google Play Billing tips integration.",
    "frontend/src/test/setup.ts": "Add Vitest DOM and storage test setup.",
    "docs/.nojekyll": "Disable Jekyll processing for GitHub Pages.",
    "docs/index.html": "Add GitHub Pages redirect to the privacy policy.",
    "docs/assets/app.ico": "Add icon asset for hosted privacy policy page.",
    "docs/privacy-policy/index.html": "Add styled GitHub Pages privacy policy.",
    "android/.gitignore": "Add Android build artifact ignore rules.",
    "android/build.gradle": "Add root Android Gradle build configuration.",
    "android/settings.gradle": "Add Android Gradle settings.",
    "android/variables.gradle": "Add shared Android SDK version variables.",
    "android/gradle.properties": "Add Android Gradle JVM and AndroidX properties.",
    "android/gradlew": "Add Gradle wrapper launcher script.",
    "android/gradlew.bat": "Add Windows Gradle wrapper launcher script.",
    "android/gradle/wrapper/gradle-wrapper.properties": "Add Gradle wrapper version configuration.",
    "android/gradle/wrapper/gradle-wrapper.jar": "Add Gradle wrapper runtime jar.",
    "android/capacitor.settings.gradle": "Add Capacitor module settings for Android.",
    "android/app/.gitignore": "Add app module build artifact ignore rules.",
    "android/app/build.gradle": "Add Android app module build and version settings.",
    "android/app/capacitor.build.gradle": "Add Capacitor Android plugin Gradle config.",
    "android/app/proguard-rules.pro": "Add ProGuard rules for release builds.",
    "android/app/src/main/AndroidManifest.xml": "Add Android app manifest and permissions.",
    "android/app/src/main/java/com/trackanything/app/MainActivity.java": "Add Capacitor main activity entry point.",
    "android/app/src/main/res/values/strings.xml": "Add Android string resources for app name.",
    "android/app/src/main/res/values/styles.xml": "Add Android theme styles for launch screen.",
    "android/app/src/main/res/values/ic_launcher_background.xml": "Add launcher icon background color.",
    "android/app/src/main/res/layout/activity_main.xml": "Add main activity layout shell.",
    "android/app/src/main/res/xml/file_paths.xml": "Add FileProvider paths for Capacitor.",
    "android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java": "Add sample Android instrumented test.",
    "android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java": "Add sample Android unit test.",
    "android/app/src/main/res/drawable/ic_launcher_background.xml": "Add adaptive launcher background drawable.",
    "android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml": "Add adaptive launcher foreground drawable.",
    "android/app/src/main/res/drawable/splash.png": "Add default portrait splash image.",
    "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml": "Add adaptive launcher icon definition.",
    "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml": "Add round adaptive launcher icon definition.",
}

PRIVACY_SITE_DELETE = "Remove unused Next.js privacy-site scaffold file."


def run(*args: str, check: bool = True) -> str:
    result = subprocess.run(
        args,
        cwd=ROOT,
        check=check,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def message_for(path: str) -> str:
    if path in MESSAGES:
        return MESSAGES[path]
    if path.startswith("privacy-site/"):
        return PRIVACY_SITE_DELETE
    p = Path(path)
    if p.suffix == ".png" and "splash" in path:
        density = p.parent.name.replace("drawable-", "").replace("port-", "").replace("land-", "")
        orientation = "landscape" if "land-" in path else "portrait"
        return f"Add {orientation} splash screen asset for {density} displays."
    if p.suffix == ".png" and "mipmap" in path:
        if "foreground" in p.name:
            return f"Add launcher foreground icon for {p.parent.name} density."
        if "round" in p.name:
            return f"Add round launcher icon for {p.parent.name} density."
        return f"Add launcher icon for {p.parent.name} density."
    return f"Update {path}."


def commit_paths(paths: list[str], tree_ref: str, *, delete: bool = False) -> None:
    for path in paths:
        msg = message_for(path)
        if delete:
            run("git", "rm", "-f", "--ignore-unmatch", path, check=False)
        else:
            run("git", "checkout", tree_ref, "--", path)
        staged = subprocess.run(
            ["git", "diff", "--cached", "--quiet", "--", path],
            cwd=ROOT,
            check=False,
        )
        if staged.returncode != 0:
            run("git", "commit", "-m", msg)


def main() -> None:
    tree_ref = run("git", "rev-parse", "HEAD")
    split_point = "f13b545"
    cherry_picks = ["5b04463", "a863390"]

    # Replay the large production commit as one commit per path.
    run("git", "reset", "--hard", split_point)
    status_lines = run("git", "diff-tree", "--no-commit-id", "--name-status", "-r", "96d49b9").splitlines()
    for line in status_lines:
        status, path = line.split("\t", 1)
        commit_paths([path], "96d49b9", delete=status == "D")

    for commit in cherry_picks:
        run("git", "cherry-pick", commit)

    # Relabel files that still carry older generic commit messages.
    remaining = run("git", "ls-files").splitlines()
    for path in remaining:
        last_msg = run("git", "log", "-1", "--format=%s", "--", path)
        if last_msg == message_for(path):
            continue
        if last_msg.startswith("Establish production repository layout"):
            commit_paths([path], tree_ref)
            continue
        if "Fitness Tracker" in last_msg or last_msg.startswith("Rebrand to Track Anything"):
            commit_paths([path], tree_ref)
            continue
        if last_msg.startswith("Add Google Play donations"):
            commit_paths([path], tree_ref)
            continue
        if last_msg.startswith("Add profiles, delete-all"):
            commit_paths([path], tree_ref)
            continue
        if last_msg.startswith("Add PRIVACY.md for the GitHub"):
            if path not in {"PRIVACY.md", "README.md", "PLAY_STORE.md", "docs/index.html"}:
                commit_paths([path], tree_ref)
            continue
        if last_msg.startswith("Add README-style hero"):
            if path not in {"docs/privacy-policy/index.html", "docs/assets/app.ico"}:
                commit_paths([path], tree_ref)
            continue
        if last_msg == "Add GitHub Pages privacy policy" and path != "docs/.nojekyll":
            commit_paths([path], tree_ref)

    print("Done. New HEAD:", run("git", "rev-parse", "--short", "HEAD"))


if __name__ == "__main__":
    main()
