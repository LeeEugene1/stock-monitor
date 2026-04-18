export function formatKRW(value: number): string {
  if (Math.abs(value) >= 100_000_000) {
    return `${(value / 100_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}억`;
  }
  if (Math.abs(value) >= 10_000) {
    return `${Math.round(value / 10_000).toLocaleString()}만`;
  }
  return value.toLocaleString();
}
