// ─────────────────────────────────────────────────────────────────────────────
// app/types.ts — Shared TypeScript types used across the whole app
//
// Keeping types in one place means every component that needs them can import
// from a single source of truth rather than re-defining them locally.
// ─────────────────────────────────────────────────────────────────────────────

// ── Which section of the app the user is currently viewing ───────────────────
// Used by page.tsx to track the active nav state and render the right page.
export type NavItem = "generate" | "history" | "about";

// ── A single saved case study in the history list ────────────────────────────
// Created in page.tsx whenever a generation completes, then stored in
// localStorage so it persists across page refreshes.
export interface HistoryItem {
  id: string;           // Unique ID generated with crypto.randomUUID()
  projectName: string;  // Copied from the form — used as the list title
  generatedAt: string;  // ISO 8601 timestamp (e.g. "2026-05-27T14:30:00.000Z")
  content: string;      // Full markdown output from the AI — stored verbatim
  preview: string;      // First plain-text line, truncated to 120 chars for the list view
}
