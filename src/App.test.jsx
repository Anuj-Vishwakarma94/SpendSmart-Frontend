import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock components that use WebGL/Canvas to avoid jsdom errors
jest.mock('./components/ui/glsl-hills', () => ({
  GLSLHills: () => <div data-testid="mock-glsl-hills" />
}));

describe('App Component', () => {
  it('renders without crashing and shows the brand name', () => {
    render(<App />);
    // The LandingPage has the brand text "SpendSmart"
    expect(screen.getAllByText(/SpendSmart/i).length).toBeGreaterThan(0);
  });
});
