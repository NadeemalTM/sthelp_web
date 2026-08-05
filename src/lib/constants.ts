export const STATUS_OPTIONS = [
  ["submitted", "Submitted"],
  ["accepted", "Accepted"],
  ["in_progress", "In progress"],
  ["client_review", "Client review"],
  ["revision", "Revision"],
  ["completed", "Completed"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"]
] as const;

export const SERVICE_TYPES = [
  "Computing / Software Development",
  "Business Report",
  "Research Guidance",
  "Presentation / PowerPoint",
  "Document Formatting",
  "Excel / Data Analysis",
  "Other Academic Support"
];

export const ACCEPTED_SUPPORT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp"
];

export const FIVE_MB = 5 * 1024 * 1024;
export const TWENTY_FIVE_MB = 25 * 1024 * 1024;
