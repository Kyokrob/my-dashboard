export function formatTHB(value) {
  const num = Number(value || 0);
  return num.toLocaleString("th-TH", { style: "currency", currency: "THB" });
}
