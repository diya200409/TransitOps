/**
 * Tests for the usePagination hook.
 */
import { renderHook, act } from '@testing-library/react'
import { usePagination } from '../hooks/usePagination'

describe('usePagination', () => {
  it('initialises with page 1 and default pageSize 20', () => {
    const { result } = renderHook(() => usePagination())
    expect(result.current.page).toBe(1)
    expect(result.current.pageSize).toBe(20)
  })

  it('computes skip = 0 and limit = 20 on page 1', () => {
    const { result } = renderHook(() => usePagination())
    expect(result.current.skip).toBe(0)
    expect(result.current.limit).toBe(20)
  })

  it('computes correct skip on page 3 with pageSize 20', () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.setPage(3))
    expect(result.current.skip).toBe(40)
    expect(result.current.limit).toBe(20)
  })

  it('accepts a custom default pageSize', () => {
    const { result } = renderHook(() => usePagination(50))
    expect(result.current.pageSize).toBe(50)
    expect(result.current.limit).toBe(50)
  })

  it('setPage updates the page', () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.setPage(5))
    expect(result.current.page).toBe(5)
  })

  it('reset returns to page 1', () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.setPage(4))
    expect(result.current.page).toBe(4)
    act(() => result.current.reset())
    expect(result.current.page).toBe(1)
  })

  it('barProps returns correct props for PaginationBar', () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.setPage(2))
    const props = result.current.barProps(100)
    expect(props.page).toBe(2)
    expect(props.pageSize).toBe(20)
    expect(props.total).toBe(100)
    expect(typeof props.onPage).toBe('function')
  })
})
