
// FIXED: Format earnings above 999 to display in K format
export function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}

// Format earnings specifically - anything above 999 displays in K
export function formatEarnings(amount: number): string {
  if (amount > 999) {
    return '$' + (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return '$' + amount.toFixed(2);
}
