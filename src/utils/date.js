export function inMonth(dateStr, monthKey) {
  // dateStr: YYYY-MM-DD, monthKey: YYYY-MM
  return dateStr.startsWith(monthKey);
}
