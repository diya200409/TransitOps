/**
 * Tests for LoginPage component.
 * Uses vi.mock to stub out router and auth context dependencies.
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
    useLocation: () => ({ state: null, pathname: '/login' }),
  }
})

const mockLogin = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user:    null,
    loading: false,
    login:   mockLogin,
    logout:  vi.fn(),
    isFleetManager: false,
  }),
}))

import LoginPage from '../pages/LoginPage'

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the email field', () => {
    renderLoginPage()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
  })

  it('renders the password field by id', () => {
    renderLoginPage()
    // Use id directly to avoid matching "Show password" aria-label
    expect(document.getElementById('password')).toBeInTheDocument()
  })

  it('renders the sign in button', () => {
    renderLoginPage()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows the TransitOps heading', () => {
    renderLoginPage()
    expect(screen.getAllByText(/transitops/i).length).toBeGreaterThan(0)
  })

  it('shows a sign up link', () => {
    renderLoginPage()
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
  })

  it('updates email input on user type', () => {
    renderLoginPage()
    const emailInput = screen.getByLabelText(/email address/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    expect(emailInput.value).toBe('test@example.com')
  })

  it('updates password input on user type', () => {
    renderLoginPage()
    const pwInput = document.getElementById('password')
    fireEvent.change(pwInput, { target: { value: 'secret123' } })
    expect(pwInput.value).toBe('secret123')
  })

  it('calls login with email and password on submit', async () => {
    mockLogin.mockResolvedValueOnce({
      access_token: 'tok',
      user: { id: 1, email: 'a@b.com', role: 'driver', full_name: 'Test' },
    })
    renderLoginPage()

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } })
    fireEvent.change(document.getElementById('password'),      { target: { value: 'Pass1234!' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('a@b.com', 'Pass1234!')
    })
  })

  it('shows an error message when login fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))
    renderLoginPage()

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'x@y.com' } })
    fireEvent.change(document.getElementById('password'),      { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('disables the submit button while loading', async () => {
    mockLogin.mockReturnValueOnce(new Promise(() => {}))
    renderLoginPage()

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@b.com' } })
    fireEvent.change(document.getElementById('password'),      { target: { value: 'Pass1234!' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /signing in/i })
      expect(btn).toBeDisabled()
    })
  })
})
