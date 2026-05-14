import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from './LandingPage';

// Mock the 3D GLSL background
jest.mock('../ui/glsl-hills', () => ({
  GLSLHills: () => <div data-testid="mock-glsl-hills" />
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LandingPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders landing page content', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    // Verify Brand
    expect(screen.getAllByText(/SpendSmart/i).length).toBeGreaterThan(0);
    
    // Verify Taglines
    expect(screen.getByText(/Intelligent personal finance tracking/i)).toBeInTheDocument();
    
    // Verify Features
    expect(screen.getByText('Expense Tracking')).toBeInTheDocument();
    expect(screen.getByText('Income Management')).toBeInTheDocument();
    expect(screen.getByText('Budget Alerts')).toBeInTheDocument();
  });

  it('navigates to login when Sign In is clicked', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const signInButtons = screen.getAllByRole('button', { name: /sign in/i });
    fireEvent.click(signInButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('navigates to register when Get Started is clicked', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const getStartedButtons = screen.getAllByRole('button', { name: /get started/i });
    fireEvent.click(getStartedButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });
});
