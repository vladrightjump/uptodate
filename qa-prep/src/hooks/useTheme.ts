import { useEffect } from "react";
import type { Theme } from "../types";
import { useLocalStorage } from "./useLocalStorage";

const ORDER: Theme[] = ["auto", "light", "dark"];

/* Paints the phone's own chrome — the iOS status bar, the Android toolbar —
   to match the page. Without this a dark-mode reader gets a cream band above
   a near-black page, which `viewport-fit=cover` makes more obvious.

   The colour is read back off the stylesheet instead of repeated here, so
   light, dark and auto all follow global.css by construction. */
function syncThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  meta.setAttribute("content", getComputedStyle(document.body).backgroundColor);
}

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>("qa-prep:theme", "auto");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    syncThemeColor();

    /* On "auto" the system can flip while the page is open. */
    if (theme !== "auto") return;
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq?.addEventListener) return;
    mq.addEventListener("change", syncThemeColor);
    return () => mq.removeEventListener("change", syncThemeColor);
  }, [theme]);

  const cycle = () =>
    setTheme((t) => ORDER[(ORDER.indexOf(t) + 1) % ORDER.length]);

  return { theme, cycle };
}
