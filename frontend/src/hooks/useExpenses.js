import { useState, useEffect, useCallback } from 'react'
import { getExpenses, createExpense } from '../api/expenses'

export const EXPENSE_CATEGORIES = ['Toll', 'Parking', 'Repair', 'Insurance', 'Permit', 'Other']

export function useExpenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [filters, setFilters]   = useState({ search: '', category: '', vehicle_id: '', date: '' })

  const fetchExpenses = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = {}
      if (filters.vehicle_id) params.vehicle_id = filters.vehicle_id
      if (filters.category)   params.category   = filters.category
      let data = await getExpenses(params)
      // Client-side search (backend doesn't support text search on expenses)
      if (filters.search) {
        const q = filters.search.toLowerCase()
        data = data.filter(e =>
          e.vehicle_name?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.expense_number?.toLowerCase().includes(q)
        )
      }
      setExpenses(data)
    } catch (e) {
      setError(e.message || 'Failed to load expenses.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  async function createExpenseFn(data) {
    const r = await createExpense(data)
    await fetchExpenses()
    return r
  }

  // Backend has no delete endpoint for expenses — no-op with refresh
  async function deleteExpense(id) {
    await fetchExpenses()
  }

  return { expenses, loading, error, filters, setFilters, createExpense: createExpenseFn, deleteExpense, refresh: fetchExpenses }
}
