export const MAINTENANCE_STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Overdue']

export const MAINTENANCE_STATUS_COLORS = {
  Scheduled:   { bg: 'bg-blue-100',  text: 'text-blue-700',  dot: 'bg-blue-500'  },
  'In Progress':{ bg: 'bg-indigo-100',text: 'text-indigo-700',dot: 'bg-indigo-500'},
  Completed:   { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  Overdue:     { bg: 'bg-red-100',   text: 'text-red-700',   dot: 'bg-red-500'   },
}

export const SERVICE_TYPES = [
  'Oil Change',
  'Tyre Rotation',
  'Brake Service',
  'Engine Overhaul',
  'AC Service',
  'Battery Replacement',
  'Suspension Check',
  'General Service',
]
