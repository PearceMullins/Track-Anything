/** Fixes Android WebView layout shrinking after device rotation. */

let lastWidth = 0;
let resetTimer: number | null = null;

function resetLayout(): void {
  const html = document.documentElement;
  const body = document.body;
  const root = document.getElementById("root");

  html.style.width = "100%";
  body.style.width = "100%";
  if (root) root.style.width = "100%";

  html.style.height = "";
  body.style.height = "";
  if (root) root.style.height = "";

  if (window.scrollY < 0) {
    window.scrollTo(0, 0);
  }
}

function scheduleReset(): void {
  if (resetTimer) return;
  resetTimer = window.setTimeout(() => {
    resetTimer = null;
    resetLayout();
  }, 150);
}

export function installViewportFix(): void {
  lastWidth = window.innerWidth;

  window.addEventListener("orientationchange", scheduleReset);

  window.visualViewport?.addEventListener("resize", () => {
    const width = window.visualViewport?.width ?? window.innerWidth;
    if (Math.abs(width - lastWidth) > 48) {
      lastWidth = width;
      scheduleReset();
    }
  });
}
