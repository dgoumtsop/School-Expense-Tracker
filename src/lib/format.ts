// 1234567 -> "1,234,567"
export function fcfa(amount: number) {
  return amount.toLocaleString("en-US");
}

// Date -> "2026-10-11"
export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
