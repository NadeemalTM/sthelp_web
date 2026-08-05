export function formatMoney(value: number | string | null | undefined, currency = "LKR") {
  if (value === null || value === undefined || value === "") return "Not confirmed";
  const number = Number(value);
  if (!Number.isFinite(number)) return "Not confirmed";
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(number);
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Colombo"
  }).format(date);
}

export function statusLabel(status?: string) {
  return (status || "unknown")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
