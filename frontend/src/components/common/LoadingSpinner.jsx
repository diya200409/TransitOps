/**
 * Inline loading spinner.
 * Props:
 *   size    – 'sm' | 'md' | 'lg'
 *   color   – Tailwind border-color class (default: 'border-blue-600')
 *   label   – optional accessible aria-label
 *   center  – if true, wraps in a centered flex container
 */
export default function LoadingSpinner({
  size = 'md',
  color = 'border-blue-600',
  label = 'Loading…',
  center = false,
}) {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-4',
  }[size] || 'w-6 h-6 border-2'

  const spinner = (
    <span
      role="status"
      aria-label={label}
      className={`inline-block rounded-full animate-spin border-gray-200 ${sizeClass} ${color}`}
      style={{ borderTopColor: 'transparent' }}
    />
  )

  if (center) {
    return (
      <div className="flex items-center justify-center py-12">
        {spinner}
      </div>
    )
  }

  return spinner
}
