import { PackageOpen } from 'lucide-react'

/**
 * Reusable "no data" placeholder.
 * Props:
 *   title       – heading text
 *   description – subtext
 *   action      – optional: { label: string, onClick: fn }
 *   icon        – optional Lucide icon component override
 */
export default function EmptyState({ title = 'No data found', description, action, icon: Icon = PackageOpen }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon size={24} className="text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
