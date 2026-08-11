import { useEffect } from "react";
import type { Theme } from "../types";
import { useLocalStorage } from "./useLocalStorage";

const ORDER: Theme[] = ["auto", "light", "dark"];

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>("qa-prep:theme", "auto");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  const cycle = () =>
    setTheme((t) => ORDER[(ORDER.indexOf(t) + 1) % ORDER.length]);

  return { theme, cycle };
}
