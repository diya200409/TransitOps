import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: { Icon: CheckCircle, colors: 'bg-green-50 border-green-200 text-green-800' },
  error:   { Icon: XCircle,     colors: 'bg-red-50 border-red-200 text-red-800'       },
  warning: { Icon: AlertTriangle,colors: 'bg-amber-50 border-amber-200 text-amber-800'},
  info:    { Icon: Info,         colors: 'bg-blue-50 border-blue-200 text-blue-800'   },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ type = 'info', message, duration = 4000 }) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  function dismiss(id) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(({ id, type, message }) => {
          const { Icon, colors } = ICONS[type] || ICONS.info
          return (
            <div
              key={id}
              className={`
                flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg
                pointer-events-auto animate-fade-in
                ${colors}
              `}
            >
              <Icon size={18} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm flex-1">{message}</p>
              <button
                onClick={() => dismiss(id)}
                className="flex-shrink-0 opacity-60 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
