import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders PocketBank title', () => {
  render(<App />);
  const titleElement = screen.getByText(/PocketBank - Modül Seçici/i);
  expect(titleElement).toBeInTheDocument();
});
