// --- Content Slot Templates ---
// Each template defines structured content slots for a page type.
// Slots can be simple (string), compound (subFields), or repeatable.

const SERVICE_SLOTS = [
  { id: "slot-meta-title", label: "Meta Title" },
  { id: "slot-meta-description", label: "Meta Description" },
  { id: "slot-hero-headline", label: "Hero Headline" },
  { id: "slot-hero-subheadline", label: "Hero Subheadline" },
  { id: "slot-hero-cta", label: "Hero CTA" },
  { id: "slot-intro-paragraph", label: "Intro Paragraph" },
  { id: "slot-value-prop", label: "Value Proposition", isRepeatable: true, subFields: ["headline", "description"] },
  { id: "slot-features-headline", label: "Features Section Headline" },
  { id: "slot-feature", label: "Feature", isRepeatable: true, subFields: ["headline", "description"] },
  { id: "slot-social-proof", label: "Social Proof / Testimonial", isRepeatable: true },
  { id: "slot-process-headline", label: "Process Section Headline" },
  { id: "slot-process-step", label: "Process Step", isRepeatable: true, subFields: ["headline", "description"] },
  { id: "slot-faq", label: "FAQ", isRepeatable: true, subFields: ["question", "answer"] },
  { id: "slot-bottom-cta-headline", label: "Bottom CTA Headline" },
  { id: "slot-bottom-cta-subtext", label: "Bottom CTA Subtext" },
  { id: "slot-bottom-cta-button", label: "Bottom CTA Button Text" },
];

const COURSE_SLOTS = [
  { id: "slot-meta-title", label: "Meta Title" },
  { id: "slot-meta-description", label: "Meta Description" },
  { id: "slot-hero-headline", label: "Hero Headline" },
  { id: "slot-hero-subheadline", label: "Hero Subheadline" },
  { id: "slot-hero-cta", label: "Hero CTA" },
  { id: "slot-course-overview", label: "Course Overview" },
  { id: "slot-learning-outcome", label: "Learning Outcome", isRepeatable: true },
  { id: "slot-module", label: "Module", isRepeatable: true, subFields: ["title", "description"] },
  { id: "slot-target-audience", label: "Target Audience" },
  { id: "slot-instructor-bio", label: "Instructor Bio" },
  { id: "slot-pricing-headline", label: "Pricing Headline" },
  { id: "slot-pricing-description", label: "Pricing Description" },
  { id: "slot-social-proof", label: "Social Proof / Testimonial", isRepeatable: true },
  { id: "slot-faq", label: "FAQ", isRepeatable: true, subFields: ["question", "answer"] },
  { id: "slot-bottom-cta-headline", label: "Bottom CTA Headline" },
  { id: "slot-bottom-cta-button", label: "Bottom CTA Button Text" },
];

const COMPANY_SLOTS = [
  { id: "slot-meta-title", label: "Meta Title" },
  { id: "slot-meta-description", label: "Meta Description" },
  { id: "slot-hero-headline", label: "Hero Headline" },
  { id: "slot-hero-subheadline", label: "Hero Subheadline" },
  { id: "slot-hero-cta", label: "Hero CTA" },
  { id: "slot-body-section", label: "Body Section", isRepeatable: true, subFields: ["headline", "description"] },
  { id: "slot-mission-statement", label: "Mission Statement" },
  { id: "slot-team-intro", label: "Team Section Intro" },
  { id: "slot-social-proof", label: "Social Proof / Testimonial", isRepeatable: true },
  { id: "slot-bottom-cta-headline", label: "Bottom CTA Headline" },
  { id: "slot-bottom-cta-button", label: "Bottom CTA Button Text" },
];

const GENERIC_SLOTS = [
  { id: "slot-meta-title", label: "Meta Title" },
  { id: "slot-meta-description", label: "Meta Description" },
  { id: "slot-hero-headline", label: "Hero Headline" },
  { id: "slot-hero-subheadline", label: "Hero Subheadline" },
  { id: "slot-hero-cta", label: "Hero CTA" },
  { id: "slot-body-section", label: "Body Section", isRepeatable: true, subFields: ["headline", "description"] },
  { id: "slot-social-proof", label: "Social Proof / Testimonial", isRepeatable: true },
  { id: "slot-bottom-cta-headline", label: "Bottom CTA Headline" },
  { id: "slot-bottom-cta-button", label: "Bottom CTA Button Text" },
];

export const SLOT_TEMPLATES = {
  service: SERVICE_SLOTS,
  course: COURSE_SLOTS,
  company: COMPANY_SLOTS,
  generic: GENERIC_SLOTS,
};

/**
 * Generate content slots from a template for a given page type.
 * Returns an array of runtime slot objects with empty fields.
 */
export function generateContentSlots(pageType) {
  const template = SLOT_TEMPLATES[pageType] || SLOT_TEMPLATES.generic;
  return template.map((t) => ({
    id: t.id,
    label: t.label,
    currentCopy: t.subFields ? Object.fromEntries(t.subFields.map((f) => [f, ""])) : "",
    revisedCopy: t.subFields ? Object.fromEntries(t.subFields.map((f) => [f, ""])) : "",
    status: "untouched",
    isCustom: false,
    isRepeatable: t.isRepeatable || false,
    subFields: t.subFields || null,
  }));
}

/**
 * Duplicate a repeatable slot. Inserts after the last slot with the same base id.
 */
export function duplicateSlot(slot, existingSlots) {
  const baseId = slot.id.replace(/-copy-\d+$/, "");
  const copies = existingSlots.filter((s) => s.id === baseId || s.id.startsWith(baseId + "-copy-"));
  const copyNum = copies.length;
  return {
    ...slot,
    id: `${baseId}-copy-${copyNum}`,
    currentCopy: slot.subFields ? Object.fromEntries(slot.subFields.map((f) => [f, ""])) : "",
    revisedCopy: slot.subFields ? Object.fromEntries(slot.subFields.map((f) => [f, ""])) : "",
    status: "untouched",
    isCustom: false,
  };
}

/**
 * Create a custom slot with the given label.
 */
export function createCustomSlot(label) {
  return {
    id: `custom-slot-${Date.now()}`,
    label,
    currentCopy: "",
    revisedCopy: "",
    status: "untouched",
    isCustom: true,
    isRepeatable: false,
    subFields: null,
  };
}
