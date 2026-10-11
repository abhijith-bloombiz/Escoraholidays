// A4 at 96 CSS px/inch: 210mm = 793.7px, 297mm = 1122.5px.
export const PAGE_WIDTH_PX = 793.7;
export const PAGE_HEIGHT_PX = 1122.5;

// These must stay in sync with PageChrome's own Tailwind padding classes in
// ItineraryPrintDocument.tsx (p-14 → 56px on every side) — expressed in raw
// px here, rather than derived from the class names, so both the CSS and
// the measurement/packing math below are reading the same numbers instead
// of two hand-kept-in-sync copies. A uniform 56px margin is enough to clear
// page 1's small logo mark (top-right, ~64px tall) and the small reference-
// code footer text printed at the bottom of every page — neither needs the
// much larger top/bottom padding the old full-page letterhead graphic once
// required. Chrome's @page margin was tried as a way to reserve this and
// confirmed, via an isolated minimal repro, to only apply to the FIRST page
// of a print job, not every page, so real per-page safe margins have to
// come from each page being its own sized container with this padding
// built in.
export const CONTENT_PAD_X_PX = 56;
export const CONTENT_PAD_TOP_PX = 56;
export const CONTENT_PAD_BOTTOM_PX = 56;

export const CONTENT_WIDTH_PX = PAGE_WIDTH_PX - CONTENT_PAD_X_PX * 2;
export const USABLE_HEIGHT_PX = PAGE_HEIGHT_PX - CONTENT_PAD_TOP_PX - CONTENT_PAD_BOTTOM_PX;
