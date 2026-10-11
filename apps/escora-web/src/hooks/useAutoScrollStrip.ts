import { useEffect, type RefObject } from "react";

/* Explore Kerala strip — continuously auto-scrolls via native scrollLeft
   (not a CSS transform), so a user's own drag/swipe on the same element
   naturally takes over and isn't fighting an animation. Pauses while the
   user is interacting or hovering, resumes shortly after they let go.
   The strip's content must be rendered twice so the loop can wrap at half
   its scrollWidth. `deps` should change whenever the cards change. */
export function useAutoScrollStrip(ref: RefObject<HTMLDivElement | null>, deps: unknown[]) {
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let paused = false;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    let position = el.scrollLeft;
    let lastTime: number | null = null;
    const SPEED_PX_PER_SEC = 28;

    function step(time: number) {
      if (lastTime === null) lastTime = time;
      const dt = time - lastTime;
      lastTime = time;

      if (!paused && el) {
        const half = el.scrollWidth / 2;
        position += (SPEED_PX_PER_SEC * dt) / 1000;
        if (position >= half) position -= half;
        el.scrollLeft = position;
      } else if (el) {
        // Stay in sync when the user (or a drag handler) moves scrollLeft directly.
        position = el.scrollLeft;
      }
      raf = requestAnimationFrame(step);
    }

    function pause() {
      paused = true;
      if (resumeTimer) clearTimeout(resumeTimer);
    }
    function scheduleResume(delay: number) {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, delay);
    }

    // Mouse drag-to-scroll (desktop) — overflow-x:auto alone doesn't let a
    // plain mouse drag scroll the way touch does, so wire it up manually.
    // A real drag (moved past DRAG_THRESHOLD) must suppress the click that
    // would otherwise follow the card's <Link>, or dragging accidentally
    // navigates to whichever card the cursor lands on.
    const DRAG_THRESHOLD = 6;
    let isDragging = false;
    let didDrag = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    function onMouseDown(e: MouseEvent) {
      isDragging = true;
      didDrag = false;
      pause();
      dragStartX = e.pageX;
      dragStartScroll = el!.scrollLeft;
    }
    function onMouseMove(e: MouseEvent) {
      if (!isDragging || !el) return;
      const delta = e.pageX - dragStartX;
      if (Math.abs(delta) > DRAG_THRESHOLD) didDrag = true;
      e.preventDefault();
      el.scrollLeft = dragStartScroll - delta;
    }
    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      scheduleResume(1500);
    }
    function onClickCapture(e: MouseEvent) {
      if (didDrag) {
        e.preventDefault();
        e.stopPropagation();
        didDrag = false;
      }
    }

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", endDrag);
    el.addEventListener("click", onClickCapture, true);
    el.addEventListener("pointerdown", pause);
    el.addEventListener("pointerup", () => scheduleResume(1500));
    el.addEventListener("pointercancel", () => scheduleResume(1500));
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", () => { if (!isDragging) scheduleResume(400); });
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", () => scheduleResume(1500), { passive: true });

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      if (resumeTimer) clearTimeout(resumeTimer);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", endDrag);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, deps);
}
