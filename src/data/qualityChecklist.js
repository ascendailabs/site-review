// Per-page quality checklist items.
// Stored on pageState as qualityChecklist: { [id]: boolean }

export const QUALITY_CHECKLIST_ITEMS = [
  { id: "logo", label: "Logo is visible, loads correctly and is spelled as Ascend AI" },
  { id: "nav", label: "Navigation menu has all the right links and none of them are broken" },
  { id: "headline", label: "The main headline clearly explains what Ascend AI does in one read" },
  { id: "hero_cta", label: "The hero CTA button is visible, clickable and leads to the right page" },
  { id: "images", label: "All images and visuals on the page load without errors" },
  { id: "flow", label: "The page tells a logical story from top to bottom without confusing jumps" },
  { id: "spelling", label: "There are no spelling or grammar errors anywhere on the page" },
  { id: "social_proof", label: "Social proof like testimonials, logos or results is present and feels credible" },
  { id: "bottom_cta", label: "There is a clear next step or CTA at the bottom of the page that works" },
  { id: "footer", label: "Footer links all work and contact or social info is present" },
];

export function countChecked(checklist) {
  if (!checklist) return 0;
  return QUALITY_CHECKLIST_ITEMS.reduce((n, item) => (checklist[item.id] ? n + 1 : n), 0);
}
