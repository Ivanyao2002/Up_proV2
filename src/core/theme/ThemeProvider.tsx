"use client";

import { useEffect, type ReactNode } from "react";
import { useThemeStore } from "./themeStore";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}

/** Script anti-flash — à injecter dans <head> */
export const themeInitScript = `
(function(){try{var k='upjunoo-theme',t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();
`.trim();
