export const STATUSES = {
  unreviewed: { label: "Not Reviewed", color: "#9E9E9E", bgColor: "#F5F5F5", sort: 0 },
  critical:   { label: "Critical",     color: "#D32F2F", bgColor: "#FFEBEE", sort: 1 },
  needs_work: { label: "Needs Work",   color: "#F57C00", bgColor: "#FFF3E0", sort: 2 },
  looks_good: { label: "Looks Good",   color: "#1976D2", bgColor: "#E3F2FD", sort: 3 },
  approved:   { label: "Approved",     color: "#2E7D32", bgColor: "#E8F5E9", sort: 4 },
};

export const STATUS_KEYS = Object.keys(STATUSES);
