const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatCurrency(value?: number | null, currency = 'USD'): string {
  if (value === undefined || value === null) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function sumAmounts(values: Array<number | undefined | null>): number {
  let total = 0;
  for (const amount of values) {
    total += amount ?? 0;
  }
  return total;
}
