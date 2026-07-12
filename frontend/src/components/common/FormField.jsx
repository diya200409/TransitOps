/**
 * Labeled form field wrapper with validation error display.
 * Supports: text, number, date, select, textarea input types.
 */
export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  options,       // for type='select': [{ value, label }] or ['string']
  min,
  max,
  disabled = false,
  hint,
}) {
  const baseInput = `
    w-full px-3 py-2 rounded-lg border text-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
    ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
  `

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={baseInput}
        >
          <option value="">Select {label}</option>
          {options?.map(opt => {
            const val = typeof opt === 'string' ? opt : opt.value
            const lbl = typeof opt === 'string' ? opt : opt.label
            return (
              <option key={val} value={val}>{lbl}</option>
            )
          })}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          rows={3}
          className={baseInput}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          min={min}
          max={max}
          className={baseInput}
        />
      )}

      {hint && !error && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
