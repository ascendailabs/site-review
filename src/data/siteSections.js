// src/data/siteSections.js

export const SITE_SECTIONS = [
  {
    id: "services",
    group: "Services",
    icon: "Bolt",
    description: "Core service offerings",
    pages: [
      { id: "ai-office", name: "AI Office", url: "https://ascendlabs.ai/ai-office/", pageType: "service" },
      { id: "ai-automations", name: "AI Automations", url: "https://ascendlabs.ai/ai-automations/", pageType: "service" },
    ],
  },
  {
    id: "courses",
    group: "Courses",
    icon: "School",
    description: "AI training courses and programs",
    pages: [
      { id: "ai-enablement", name: "AI Ambassadors (AIA)", url: "https://ascendlabs.ai/ai-enablement/", pageType: "course" },
      { id: "courses-overview", name: "Main Course Page", url: "https://ascendlabs.ai/courses/", pageType: "course" },
      { id: "course-ai-task-deconstruction", name: "Task Deconstruction", url: "https://ascendlabs.ai/courses/ai-task-deconstruction/", pageType: "course" },
      { id: "course-implementation", name: "AI Implementation Fundamentals", url: "https://ascendlabs.ai/courses/ai-implementation-fundamentals/", pageType: "course" },
      { id: "course-risk-managers", name: "AI Risk & Governance for Managers", url: "https://ascendlabs.ai/courses/ai-risk-and-governance-for-managers/", pageType: "course" },
      { id: "course-capstone", name: "AI Innovation Leadership Capstone", url: "https://ascendlabs.ai/courses/ai-innovation-leadership-capstone/", pageType: "course" },
      { id: "course-prompting", name: "Practical Prompting", url: "https://ascendlabs.ai/courses/practical-prompting/", pageType: "course" },
      { id: "course-eu-ai-act", name: "EU AI Act", url: "https://ascendlabs.ai/courses/eu-ai-act-add-on/", pageType: "course" },
      { id: "course-managing-ai-risk", name: "Managing & Mitigating AI Risk for All Employees", url: "https://ascendlabs.ai/courses/managing-and-mitigating-ai-risk-for-all-employees/", pageType: "course" },
      { id: "course-ai-risk-governance", name: "AI Risk & Governance for Senior Leaders", url: "https://ascendlabs.ai/courses/ai-risk-and-governance-for-senior-leaders/", pageType: "course" },
      { id: "course-gpt-overview", name: "GPT Overview", url: "https://ascendlabs.ai/courses/gpt-overview/", pageType: "course" },
    ],
  },
  {
    id: "podcasts",
    group: "Podcasts & Content",
    icon: "Podcasts",
    description: "Podcast episodes, content hub, and media",
    pages: [
      { id: "content-hub", name: "Content Hub", url: "https://ascendlabs.ai/content/", pageType: "generic" },
      { id: "podcast-main", name: "Podcast (Main)", url: "https://ascendlabs.ai/podcast-2/", pageType: "generic" },
      { id: "podcast-digest", name: "Podcast Digest", url: "https://ascendlabs.ai/podcast/", pageType: "generic" },
    ],
  },
  {
    id: "blog",
    group: "Blog",
    icon: "Article",
    description: "Blog posts and articles",
    pages: [
      { id: "blog", name: "Blog Main", url: "https://ascendlabs.ai/blog/", pageType: "generic" },
    ],
  },
  {
    id: "company",
    group: "Company",
    icon: "Business",
    description: "Company pages, about, contact, legal",
    pages: [
      { id: "home", name: "Home Page", url: "https://ascendlabs.ai/", pageType: "company" },
      { id: "about", name: "About Us", url: "https://ascendlabs.ai/about-us/", pageType: "company" },
      { id: "partner-program", name: "Partners", url: "https://ascendlabs.ai/ai-enablement-partner-program/", pageType: "company" },
      { id: "contact", name: "Contact Us", url: "https://ascendlabs.ai/contact-us/", pageType: "company" },
      { id: "careers", name: "Careers", url: "https://ascendlabs.ai/careers/", pageType: "company" },
      { id: "terms", name: "Terms & Conditions", url: "https://ascendlabs.ai/terms-and-conditions/", pageType: "company" },
    ],
  },
  {
    id: "landing-pages",
    group: "Landing Pages",
    icon: "Campaign",
    description: "Campaign and lead gen landing pages — not in main nav",
    pages: [
      { id: "ai-quick-win-audit", name: "AI Quick Win Audit", url: "https://ascendlabs.ai/ai-quick-win-audit/", pageType: "generic" },
      { id: "ai-readiness-assessment", name: "AI Readiness Assessment", url: "https://ascendlabs.ai/ai-readiness-assessment/", pageType: "generic" },
      { id: "ai-proficiency-test", name: "AI Proficiency Test", url: "https://ascendlabs.ai/ai-proficiency-test-individuals/", pageType: "generic" },
      { id: "free-courses-resources", name: "Free Courses & Resources", url: "https://ascendlabs.ai/explore-free-courses-resources/", pageType: "generic" },
      { id: "newsletter", name: "Newsletter", url: "https://ascendlabs.ai/news-letter-page-product/", pageType: "generic" },
    ],
  },
];
