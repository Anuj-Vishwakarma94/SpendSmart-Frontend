import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserLayout } from './UserLayout';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
}));

describe('UserLayout Component', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      user: { fullName: 'Alice Smith', currency: 'USD' },
      logout: mockLogout,
    });
  });

  it('renders sidebar navigation links correctly', () => {
    render(
      <MemoryRouter>
        <UserLayout>
          <div>Dashboard Content</div>
        </UserLayout>
      </MemoryRouter>
    );

    // Verify main content is rendered
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();

    // Verify User Info
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();

    // Verify Navigation Links
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
  });

  it('handles logout successfully', async () => {
    render(
      <MemoryRouter>
        <UserLayout>
          <div>Content</div>
        </UserLayout>
      </MemoryRouter>
    );

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });

    expect(toast.success).toHaveBeenCalledWith('Logged out');
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
