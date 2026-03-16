export function getMonthKey(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
  }
  const raw = String(value).trim();
  const match = raw.match(/(\d{4})[-/](\d{1,2})/);
  if (match) {
    return `${match[1]}-${String(match[2]).padStart(2, "0")}`;
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
  }
  return "";
}

export function inMonth(dateValue, monthKey) {
  if (!dateValue || !monthKey) return false;
  const key = getMonthKey(dateValue);
  if (key) return key === monthKey;
  return String(dateValue).startsWith(monthKey);
}
