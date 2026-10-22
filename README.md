# Track Anything

A self-contained HTML app for tracking custom metrics, reviewing history, and
charting progress. All styling and application logic are included in the HTML.
Your entries stay in your browser; no account or installation is required.

**[Open the app](https://pearcemullins.github.io/Track-Anything/)** ·
**[Download the HTML file](https://raw.githubusercontent.com/PearceMullins/Track-Anything/main/Track%20Anything.html)** ·
**[Support on Patreon](https://www.patreon.com/cw/PearceMullins)**

## iPhone, iPad, and Mac

Use an up-to-date Safari and **[open Track Anything](https://pearcemullins.github.io/Track-Anything/)**.
On iPhone and iPad, open this link in Safari rather than an HTML preview in
Files, Mail, or another app.

- **Home Screen:** in Safari, tap Share, then **Add to Home Screen**. If your
  device offers **Open as Web App**, enable it. Open the new icon to use the app.
- **Mac:** use the hosted app in Safari or open the downloaded HTML file in
  Safari. Supported versions also offer **File → Add to Dock**.
- **Backups:** open **Data → Share**, then choose **Save to Files** when offered.
  If file sharing is unavailable, use **Export** and save the downloaded JSON
  file. To restore it, use **Data → Import** and choose the JSON file in Files.
  A canceled share leaves your data unchanged.

The layout adapts to phone portrait/landscape, tablets, and narrow iPad windows.
Pinch zoom remains available; dialogs resize with the visible keyboard area.
Entries save locally, without an account or automatic iCloud sync. To move
between devices, browsers, or a separate Home Screen app, export and import
a backup. Keep regular backups: Safari can remove website data under storage
pressure or after inactivity, and private browsing may discard it when closed.

Opening or reloading the hosted app requires internet access. Adding its icon
does not install an offline cache. A downloaded HTML file works offline in a
desktop browser; iPhone/iPad file previews are not the supported launch method.

Apple instructions: [iPhone Home Screen](https://support.apple.com/guide/iphone/bookmark-a-website-iph42ab2f3a7/ios),
[iPad Home Screen](https://support.apple.com/guide/ipad/bookmark-a-website-ipadc602b75b/ipados),
[Mac web apps](https://support.apple.com/104996).
Implementation references: [WebKit user activation](https://webkit.org/blog/13862/the-user-activation-api/),
[safe areas](https://webkit.org/blog/7929/designing-websites-for-iphone-x/), and
[storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/).

## Open locally on a desktop

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

Compatibility checks use automated WebKit on Windows at phone, tablet, and
desktop sizes. This is not physical iPhone/iPad or macOS Safari testing;
native share sheets, Files pickers, and Home Screen installation still need
real-device verification.

Before submitting changes, check entry creation and editing, profiles,
equations, calendar selection, history deletion, charts, backups, reset, and
the Patreon link. Verify saved data survives a reload and that opening the
app makes no network requests. Test the downloaded file and hosted copy.

[Privacy](PRIVACY.md) · [Contributing](CONTRIBUTING.md) ·
[Security](SECURITY.md) · [Donations](DONATIONS.md) · [MIT license](LICENSE)
