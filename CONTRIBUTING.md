# Contributing

Open an issue before larger changes. Keep changes focused and update related
documentation when behavior changes.

The application lives entirely in `Track Anything.html`, including inline CSS
and JavaScript. Edit this file directly, then copy it to `docs/index.html` so
the downloaded and hosted applications remain identical. No build step is
required. Preserve included third-party license notices.

Test in a modern browser using a disposable profile or test data:

1. Create profiles and entries, including custom equations and notes.
2. Save, apply, rename, and remove equations; navigate the calendar.
3. Edit and delete history; view charts and toggle forecasting.
4. Export a backup, change data, import it, and verify restoration.
5. Reload and verify data persists; check reset confirmation controls.
6. Verify the Patreon link, downloaded file, and hosted app.
7. Check the browser console and ensure the app loads without external assets
   or network requests.
8. Check phone portrait/landscape, iPad narrow windows, pinch zoom, 16px touch
   inputs, and dialog scrolling while the keyboard is visible. Verify unsupported
   file sharing exports JSON, rejected sharing offers Export, and cancel does
   not trigger another action. Test Safari's Files picker and share sheet on
   a real Apple device when available; report emulation separately.

Do not commit personal tracker data or exported backups. Include validation
results in your pull request.
