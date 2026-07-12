import { Filter } from 'lucide-react'

/**
 * Generic filter bar with one or more select dropdowns.
 *
 * Props:
 *   filters – array of filter config objects:
 *     {
 *       key: string,            // the key in the `values` object
 *       label: string,          // placeholder/label text
 *       options: string[]       // list of option strings
 *     }
 *   values  – object: { [key]: selectedValue }
 *   onChange – called with (key, newValue) when a select changes
 */
export default function FilterBar({ filters = [], values = {}, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Filter size={14} />
        <span>Filter:</span>
      </div>
      {filters.map(({ key, label, options }) => (
        <select
          key={key}
          value={values[key] || ''}
          onChange={e => onChange(key, e.target.value)}
          className="
            text-sm border border-gray-300 rounded-lg px-3 py-1.5
            bg-white text-gray-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          "
        >
          <option value="">All {label}</option>
          {options.map(opt => {
            const val = typeof opt === 'string' ? opt : opt.value
            const lbl = typeof opt === 'string' ? opt : opt.label
            return (
              <option key={val} value={val}>{lbl}</option>
            )
          })}
        </select>
      ))}
    </div>
  )
}
