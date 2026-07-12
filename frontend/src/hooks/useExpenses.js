import { useState, useEffect, useCallback } from 'react'
import { mockExpenseService } from '../mock/expensesMock'

// ── Toggle to swap mock ↔ real API ─────────────────────────────────────────
// import * as expenseApi from '../api/expenses'
const USE_MOCK = true
const service  = USE_MOCK ? mockExpenseService : null
// ──────────────────────────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = ['Toll', 'Parking', 'Repair', 'Insurance', 'Permit', 'Other']

export function useExpenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [filters, setFilters]   = useState({ search: '', category: '', vehicle_id: '', date: '' })

  const fetchExpenses = useCallback(async () => {
    setLoading(true); setError(null)
    try   { setExpenses(await service.getAll(filters)) }
    catch (e) { setError(e.message || 'Failed to load expenses.') }
    finally   { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const createExpense = async d   => { const r = await service.create(d);  await fetchExpenses(); return r }
  const deleteExpense = async id  => { await service.delete(id);            await fetchExpenses()           }

  return { expenses, loading, error, filters, setFilters, createExpense, deleteExpense, refresh: fetchExpenses }
}
