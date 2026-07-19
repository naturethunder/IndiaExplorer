/**
 * format.js — tiny shared formatting utilities (no DOM, no data access).
 */

/** Escape text before injecting via innerHTML. Escapes & < > " '. */
export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Indian-style thousands formatting for prices (mirrors the old toLocaleString calls). */
export function inr(n) {
  return (n || 0).toLocaleString();
}

/** Human label for a type id: hill_station → "hill station". */
export function typeLabel(type) {
  return (type || '').replace(/_/g, ' ');
}
