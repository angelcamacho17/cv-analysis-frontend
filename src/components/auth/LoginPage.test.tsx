import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';

// Mock auth context
const mockLogin = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    token: null,
    user: null,
    login: mockLogin,
    logout: vi.fn(),
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
  };

  it('renders login form', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Iniciar Sesion' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText(/Contrase/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Iniciar Sesion/i })).toBeInTheDocument();
  });

  it('disables submit button when fields are empty', () => {
    renderPage();
    const button = screen.getByRole('button', { name: /Iniciar Sesion/i });
    expect(button).toBeDisabled();
  });

  it('enables submit button when fields are filled', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/Contrase/i), { target: { value: 'password123' } });

    const button = screen.getByRole('button', { name: /Iniciar Sesion/i });
    expect(button).not.toBeDisabled();
  });

  it('submits form and calls login on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        token: 'jwt-token',
        user: { id: 1, email: 'test@test.com', fullName: 'Test' },
      })),
    });

    renderPage();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/Contrase/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesion/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
        })
      );
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('jwt-token', expect.objectContaining({ id: 1 }));
    });
  });

  it('shows error on invalid credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('{}'),
    });

    renderPage();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/Contrase/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesion/i }));

    await waitFor(() => {
      expect(screen.getByText(/Email o contrase/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    renderPage();
    const passwordInput = screen.getByLabelText(/Contrase/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click show password button
    const toggleButton = passwordInput.parentElement?.querySelector('button');
    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });

  it('shows session expired message', () => {
    localStorage.setItem('session_expired', '1');
    renderPage();
    expect(screen.getByText(/Tu sesion ha expirado/i)).toBeInTheDocument();
    localStorage.removeItem('session_expired');
  });
});
