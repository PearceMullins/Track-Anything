# Track Anything

A self-contained HTML app for tracking custom metrics, reviewing history, and
charting progress. All styling and application logic are included in the HTML.
Your entries stay in your browser; no account or installation is required.

**[Open the app](https://pearcemullins.github.io/Track-Anything/)** ·
**[Download the HTML file](https://raw.githubusercontent.com/PearceMullins/Track-Anything/main/Track%20Anything.html)** ·
**[Support on Patreon](https://patreon.com/TrackAnything?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink)**

## Open locally

Download `Track Anything.html`, then double-click it or open it in a modern
browser. It works offline. If the download link displays the app's source,
save the page as `Track Anything.html` and open the saved file.

The HTML includes its CSS and JavaScript, so no separate assets, build tools,
or server are needed. JavaScript and browser local storage must be enabled.

## Features

- Profiles for separate tracking spaces.
- Custom names, dates, notes, and any number of numeric inputs per entry.
- Equation builder with addition, subtraction, multiplication, division,
  powers, and remainders; custom expressions with functions and constants.
- Saved equations that can be applied, renamed, or deleted.
- History with editing, selection, and deletion controls.
- Progress charts with notes on points and optional forecasts.
- Calendar picker with month navigation and a Today shortcut.
- Data export, import, sharing when supported, and a confirmed factory reset.
- Optional Patreon support; all features remain free.

## Data and backups

Data is saved in this browser's local storage. The hosted app and a downloaded
copy have separate storage, as do different browsers. Moving or renaming a
local file can change its storage location in some browsers. Private browsing
may discard data when closed.

Use **Data → Export** regularly. To transfer existing data, export a backup
from the copy containing it and use **Data → Import** in the destination.
Import replaces current app data after confirmation. Export first if you
want to keep it. Browser sharing support varies; Export always offers a
download. Factory reset requires typing `factory reset`.

## Repository

- `Track Anything.html` is the downloadable app and canonical editable file.
- `docs/index.html` is an identical copy published by GitHub Pages.
- `docs/privacy-policy/index.html` publishes the privacy notice.
- Documentation and `LICENSE` describe usage, contributions, and licensing.

To update the app, edit its inline HTML, CSS, or JavaScript, test it in a
browser, and copy the finished file to `docs/index.html`. Keep both app files
identical. GitHub Pages publishes the `docs` directory from `main`.

Before submitting changes, check entry creation and editing, profiles,
equations, calendar selection, history deletion, charts, backups, reset, and
the Patreon link. Verify saved data survives a reload and that opening the
app makes no network requests. Test the downloaded file and hosted copy.

[Privacy](PRIVACY.md) · [Contributing](CONTRIBUTING.md) ·
[Security](SECURITY.md) · [Donations](DONATIONS.md) · [MIT license](LICENSE)
