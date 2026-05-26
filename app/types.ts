export type NavItem = "generate" | "history" | "about";

export interface HistoryItem {
  id: string;
  projectName: string;
  generatedAt: string; // ISO string
  content: string;     // full markdown output
  preview: string;     // first plain-text line, truncated
}
