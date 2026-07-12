/**
 * Tests for SignupPage component.
 * Uses element IDs for unambiguous field selection.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockSignup = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    signup: mockSignup,
    user:   null,
  }),
}))

import SignupPage from '../pages/SignupPage'

function renderSignupPage() {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <SignupPage />
    </MemoryRouter>
  )
}

// Helper: get fields by their HTML id (avoids label ambiguity with toggle buttons)
const field = (id) => document.getElementById(id)

describe('SignupPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders all form fields', () => {
    renderSignupPage()
    expect(field('full_name')).toBeInTheDocument()
    expect(field('email')).toBeInTheDocument()
    expect(field('password')).toBeInTheDocument()
    expect(field('confirm')).toBeInTheDocument()
    expect(field('role')).toBeInTheDocument()
  })

  it('renders a sign in link', () => {
    renderSignupPage()
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders the Create Account button', () => {
    renderSignupPage()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows password mismatch warning when passwords differ', () => {
    renderSignupPage()
    fireEvent.change(field('password'), { target: { value: 'Abc1234!' } })
    fireEvent.change(field('confirm'),  { target: { value: 'different' } })
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it('shows error when submitting with empty full name', async () => {
    renderSignupPage()
    fireEvent.change(field('email'),    { target: { value: 'a@b.com' } })
    fireEvent.change(field('password'), { target: { value: 'Test1234!' } })
    fireEvent.change(field('confirm'),  { target: { value: 'Test1234!' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
    })
  })

  it('shows error when passwords do not match on submit', async () => {
    renderSignupPage()
    fireEvent.change(field('full_name'), { target: { value: 'Jane Doe' } })
    fireEvent.change(field('email'),     { target: { value: 'j@d.com' } })
    fireEvent.change(field('password'),  { target: { value: 'Abc1234!' } })
    fireEvent.change(field('confirm'),   { target: { value: 'Mismatch!' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    // Both the inline indicator AND the form-level error alert show the same text
    await waitFor(() => {
      const matches = screen.getAllByText(/passwords do not match/i)
      expect(matches.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('calls signup with correct args on valid submission', async () => {
    mockSignup.mockResolvedValueOnce(undefined)
    renderSignupPage()

    fireEvent.change(field('full_name'), { target: { value: 'Jane Doe' } })
    fireEvent.change(field('email'),     { target: { value: 'jane@co.com' } })
    fireEvent.change(field('password'),  { target: { value: 'Secure1!' } })
    fireEvent.change(field('confirm'),   { target: { value: 'Secure1!' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('jane@co.com', 'Secure1!', 'Jane Doe', 'driver')
    })
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('shows error message when signup API fails', async () => {
    mockSignup.mockRejectedValueOnce(new Error('Email already in use'))
    renderSignupPage()

    fireEvent.change(field('full_name'), { target: { value: 'Bob' } })
    fireEvent.change(field('email'),     { target: { value: 'dup@co.com' } })
    fireEvent.change(field('password'),  { target: { value: 'Secure1!' } })
    fireEvent.change(field('confirm'),   { target: { value: 'Secure1!' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/email already in use/i)).toBeInTheDocument()
    })
  })

  it('disables the button and shows loading text while submitting', async () => {
    mockSignup.mockReturnValueOnce(new Promise(() => {}))
    renderSignupPage()

    fireEvent.change(field('full_name'), { target: { value: 'Jane' } })
    fireEvent.change(field('email'),     { target: { value: 'j@co.com' } })
    fireEvent.change(field('password'),  { target: { value: 'Secure1!' } })
    fireEvent.change(field('confirm'),   { target: { value: 'Secure1!' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /creating account/i })
      expect(btn).toBeDisabled()
    })
  })
})
