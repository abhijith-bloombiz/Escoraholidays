import { createContext, useContext, useEffect } from "react";

/**
 * V3 redesign preview — everything mounted under the `/v3` nested route
 * renders with the new light botanical palette and Manrope-only typography.
 *
 * The flag lives on <html> (not a wrapper div) so the body background,
 * portalled UI (dialogs, toasts) and the custom cursor all pick up the
 * `html.theme-v3` token overrides in theme-v3.css.
 */
const V3Context = createContext(false);

export function useIsV3() {
  return useContext(V3Context);
}

export function V3Provider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("theme-v3");

    // The preview duplicates live content — keep it out of search indexes.
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousRobots = robots?.content;
    if (robots) robots.content = "noindex, nofollow";

    return () => {
      document.documentElement.classList.remove("theme-v3");
      if (robots && previousRobots !== undefined) robots.content = previousRobots;
    };
  }, []);

  return <V3Context.Provider value={true}>{children}</V3Context.Provider>;
}
