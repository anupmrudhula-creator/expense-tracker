const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatMoney(minor: number): string {
  return formatter.format(minor / 100);
}

// Returns paise. Anything unparseable or non-positive comes back as 0.
export function parseMoney(input: string): number {
  const n = Number(input.replace(/[,\s₹]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}
