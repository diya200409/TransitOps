export const TRIP_STATUSES = ['Pending', 'Dispatched', 'In Progress', 'Completed', 'Cancelled']

export const TRIP_STATUS_COLORS = {
  Pending:     { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  Dispatched:  { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  'In Progress':{ bg: 'bg-indigo-100',text: 'text-indigo-700', dot: 'bg-indigo-500' },
  Completed:   { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  Cancelled:   { bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400'   },
}
