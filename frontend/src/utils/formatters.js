/**
 * Format a number as currency (INR by default for logistics context)
 */
export function formatCurrency(value, currency = 'INR') {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Returns true if the given date is within `days` days from today (or already past)
 */
export function isExpiringSoon(dateStr, days = 30) {
  if (!dateStr) return false
  const expiry = new Date(dateStr)
  const today = new Date()
  const diff = (expiry - today) / (1000 * 60 * 60 * 24)
  return diff <= days
}

/**
 * Returns true if the given date is in the past
 */
export function isExpired(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}
