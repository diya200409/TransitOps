/**
 * Tests for PaginationBar component.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import PaginationBar from '../components/common/PaginationBar'

describe('PaginationBar', () => {
  it('renders nothing when total is 0', () => {
    const { container } = render(
      <PaginationBar page={1} pageSize={20} total={0} onPage={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows correct record range on first page', () => {
    render(<PaginationBar page={1} pageSize={20} total={47} onPage={vi.fn()} />)
    expect(screen.getByText(/1–20/)).toBeInTheDocument()
    expect(screen.getByText(/47/)).toBeInTheDocument()
  })

  it('shows correct record range on last page', () => {
    render(<PaginationBar page={3} pageSize={20} total={47} onPage={vi.fn()} />)
    expect(screen.getByText(/41–47/)).toBeInTheDocument()
  })

  it('shows correct range on middle page', () => {
    render(<PaginationBar page={2} pageSize={20} total={100} onPage={vi.fn()} />)
    expect(screen.getByText(/21–40/)).toBeInTheDocument()
  })

  it('calls onPage with correct page when next is clicked', () => {
    const onPage = vi.fn()
    render(<PaginationBar page={1} pageSize={20} total={60} onPage={onPage} />)
    fireEvent.click(screen.getByTitle('Next page'))
    expect(onPage).toHaveBeenCalledWith(2)
  })

  it('calls onPage with correct page when previous is clicked', () => {
    const onPage = vi.fn()
    render(<PaginationBar page={3} pageSize={20} total={100} onPage={onPage} />)
    fireEvent.click(screen.getByTitle('Previous page'))
    expect(onPage).toHaveBeenCalledWith(2)
  })

  it('disables first/prev buttons on first page', () => {
    render(<PaginationBar page={1} pageSize={20} total={60} onPage={vi.fn()} />)
    expect(screen.getByTitle('First page')).toBeDisabled()
    expect(screen.getByTitle('Previous page')).toBeDisabled()
  })

  it('disables next/last buttons on last page', () => {
    render(<PaginationBar page={3} pageSize={20} total={60} onPage={vi.fn()} />)
    expect(screen.getByTitle('Next page')).toBeDisabled()
    expect(screen.getByTitle('Last page')).toBeDisabled()
  })

  it('renders page number buttons', () => {
    render(<PaginationBar page={2} pageSize={20} total={100} onPage={vi.fn()} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('calls onPage when a page number is clicked', () => {
    const onPage = vi.fn()
    render(<PaginationBar page={1} pageSize={20} total={100} onPage={onPage} />)
    fireEvent.click(screen.getByText('3'))
    expect(onPage).toHaveBeenCalledWith(3)
  })

  it('does not call onPage when loading is true and next is clicked', () => {
    const onPage = vi.fn()
    render(<PaginationBar page={1} pageSize={20} total={60} onPage={onPage} loading={true} />)
    // loading=true disables the button internally
    fireEvent.click(screen.getByTitle('Next page'))
    expect(onPage).not.toHaveBeenCalled()
  })
})
