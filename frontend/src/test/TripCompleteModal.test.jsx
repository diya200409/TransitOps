/**
 * Tests for TripCompleteModal component.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import TripCompleteModal from '../components/trips/TripCompleteModal'

// Mock the Modal wrapper to render children directly (avoids portal issues)
vi.mock('../components/common/Modal', () => ({
  default: ({ open, children }) => open ? <div data-testid="modal">{children}</div> : null,
}))

const MOCK_TRIP = {
  id:          42,
  trip_number: 'TRP-0042',
  origin:      'Mumbai',
  destination: 'Pune',
  revenue:     15000,
}

describe('TripCompleteModal', () => {
  it('renders nothing when open is false', () => {
    const { queryByTestId } = render(
      <TripCompleteModal
        trip={MOCK_TRIP}
        open={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        loading={false}
      />
    )
    expect(queryByTestId('modal')).toBeNull()
  })

  it('renders the trip number and route when open', () => {
    render(
      <TripCompleteModal
        trip={MOCK_TRIP}
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        loading={false}
      />
    )
    expect(screen.getByText('TRP-0042')).toBeInTheDocument()
    expect(screen.getByText(/Mumbai.*Pune/)).toBeInTheDocument()
  })

  it('renders the Final Odometer and Fuel Consumed fields', () => {
    render(
      <TripCompleteModal
        trip={MOCK_TRIP}
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        loading={false}
      />
    )
    expect(document.getElementById('final_odometer')).toBeInTheDocument()
    expect(document.getElementById('fuel_consumed')).toBeInTheDocument()
  })

  it('shows validation error when odometer is empty on submit', async () => {
    render(
      <TripCompleteModal
        trip={MOCK_TRIP}
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        loading={false}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /complete trip/i }))
    await waitFor(() => {
      expect(screen.getByText(/odometer reading is required/i)).toBeInTheDocument()
    })
  })

  it('shows validation error when fuel is missing', async () => {
    render(
      <TripCompleteModal
        trip={MOCK_TRIP}
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        loading={false}
      />
    )
    fireEvent.change(document.getElementById('final_odometer'), { target: { value: '15000' } })
    fireEvent.click(screen.getByRole('button', { name: /complete trip/i }))
    await waitFor(() => {
      expect(screen.getByText(/fuel consumed is required/i)).toBeInTheDocument()
    })
  })

  it('calls onConfirm with correct data on valid submit', async () => {
    const onConfirm = vi.fn().mockResolvedValueOnce(undefined)
    render(
      <TripCompleteModal
        trip={MOCK_TRIP}
        open={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        loading={false}
      />
    )
    fireEvent.change(document.getElementById('final_odometer'), { target: { value: '15750.5' } })
    fireEvent.change(document.getElementById('fuel_consumed'),  { target: { value: '45.5' } })
    // Clear the revenue field so it submits as undefined
    fireEvent.change(document.getElementById('revenue'),        { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /complete trip/i }))

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({
        final_odometer: 15750.5,
        fuel_consumed:  45.5,
        revenue:        undefined,
      })
    })
  })

  it('passes revenue as a number when entered', async () => {
    const onConfirm = vi.fn().mockResolvedValueOnce(undefined)
    render(
      <TripCompleteModal
        trip={MOCK_TRIP}
        open={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        loading={false}
      />
    )
    fireEvent.change(document.getElementById('final_odometer'), { target: { value: '16000' } })
    fireEvent.change(document.getElementById('fuel_consumed'),  { target: { value: '50' } })
    fireEvent.change(document.getElementById('revenue'),        { target: { value: '20000' } })
    fireEvent.click(screen.getByRole('button', { name: /complete trip/i }))

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ revenue: 20000 })
      )
    })
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(
      <TripCompleteModal
        trip={MOCK_TRIP}
        open={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        loading={false}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('disables the Complete button when loading', () => {
    render(
      <TripCompleteModal
        trip={MOCK_TRIP}
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        loading={true}
      />
    )
    expect(screen.getByRole('button', { name: /completing/i })).toBeDisabled()
  })
})
