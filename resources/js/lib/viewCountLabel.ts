export function viewCountLabel(count: number): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0

  return `${safe.toLocaleString('en-US')} ${safe === 1 ? 'view' : 'views'}`
}
