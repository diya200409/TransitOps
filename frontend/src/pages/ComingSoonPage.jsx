import { Construction } from 'lucide-react'

/**
 * Generic placeholder for out-of-scope nav items (Trips, Maintenance, etc.)
 */
export default function ComingSoonPage({ title = 'Coming Soon' }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-5">
        <Construction size={28} className="text-amber-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-700 mb-2">{title}</h2>
      <p className="text-gray-400 text-sm max-w-xs">
        This module is being built by the backend team. It will be available soon.
      </p>
    </div>
  )
}
