import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'

/**
 * Debounced search input.
 * Props:
 *   value       – controlled value (optional, if parent manages state)
 *   onChange    – called with new string value after debounce
 *   placeholder – input placeholder text
 *   debounce    – debounce delay in ms (default 300)
 */
export default function SearchBar({
  value: externalValue,
  onChange,
  placeholder = 'Search…',
  debounce = 300,
}) {
  const [internal, setInternal] = useState(externalValue || '')

  // Keep internal state in sync when parent resets value
  useEffect(() => {
    if (externalValue !== undefined) setInternal(externalValue)
  }, [externalValue])

  // Debounce the onChange callback
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange?.(internal)
    }, debounce)
    return () => clearTimeout(timer)
  }, [internal, debounce]) // intentionally omit onChange to avoid stale closure churn

  function clear() {
    setInternal('')
    onChange?.('')
  }

  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        value={internal}
        onChange={e => setInternal(e.target.value)}
        placeholder={placeholder}
        className="
          w-full pl-9 pr-8 py-2 text-sm
          border border-gray-300 rounded-lg
          bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        "
      />
      {internal && (
        <button
          onClick={clear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
