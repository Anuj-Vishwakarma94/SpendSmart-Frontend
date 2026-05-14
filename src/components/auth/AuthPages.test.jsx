import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage, RegisterPage } from './AuthPages';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }) => (
    <button data-testid="mock-google-login" onClick={() => onSuccess({ credential: 'mock-token' })}>
      Mock Google Login
    </button>
  ),
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('AuthPages Component', () => {
  const mockLogin = jest.fn();
  const mockRegister = jest.fn();
  const mockLoginWithGoogle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      login: mockLogin,
      register: mockRegister,
      loginWithGoogle: mockLoginWithGoogle,
      loading: false,
    });
  });

  describe('LoginPage', () => {
    it('renders login form correctly', () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );
      
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      // Use getByPlaceholderText or getAllByText if labels are tricky
      expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('submits login form successfully', async () => {
      mockLogin.mockResolvedValueOnce({ user: { id: 1 } });
      
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } });
      
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
      });
      expect(toast.success).toHaveBeenCalledWith('Welcome back!');
    });
  });

  describe('RegisterPage', () => {
    it('renders register form correctly', () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );
      
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Jane Doe/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('submits register form successfully', async () => {
      mockRegister.mockResolvedValueOnce({ user: { id: 1 } });
      
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText(/Jane Doe/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/Min. 8 characters/i), { target: { value: 'password123' } });
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'password123'
        }));
      });
      expect(toast.success).toHaveBeenCalledWith('Account created!');
    });
  });
});
