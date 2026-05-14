import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import { useAuth } from '../../context/AuthContext';
import { ExpenseService } from '../../services/api';

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock ExpenseService
jest.mock('../../services/api', () => ({
  ExpenseService: {
    getAll: jest.fn(),
    getTotalByMonth: jest.fn(),
    getTotal: jest.fn(),
  },
}));

// Mock Recharts to avoid ResizeObserver errors in jsdom
jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 800, height: 200 }}>{children}</div>
    ),
  };
});

const mockExpenses = [
  { expenseId: '1', title: 'Groceries', amount: 1500, categoryId: '1', paymentMethod: 'UPI', date: '2026-05-10' },
  { expenseId: '2', title: 'Internet', amount: 1000, categoryId: '2', paymentMethod: 'CARD', date: '2026-05-11' },
];

describe('DashboardPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      user: { fullName: 'John Doe', currency: 'INR', monthlyBudget: 50000 },
    });
    
    ExpenseService.getAll.mockResolvedValue(mockExpenses);
    ExpenseService.getTotalByMonth.mockResolvedValue({ total: 2500 });
    ExpenseService.getTotal.mockResolvedValue({ total: 10000 });
  });

  it('renders loading state initially', () => {
    ExpenseService.getAll.mockImplementation(() => new Promise(() => {}));
    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('renders dashboard correctly after loading data', async () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Wait for the spinner to disappear and content to appear
    await waitFor(() => {
      expect(container.querySelector('.spinner')).not.toBeInTheDocument();
    });

    // Verify Greeting
    expect(screen.getByText(/Good/i)).toBeInTheDocument();
    expect(screen.getByText(/John/i)).toBeInTheDocument();

    // Verify Stats
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('₹2,500.00')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
    expect(screen.getByText('₹10,000.00')).toBeInTheDocument();
    
    // Verify Recent Expenses table
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Internet')).toBeInTheDocument();
  });
});
