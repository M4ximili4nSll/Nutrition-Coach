import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(() => jest.fn())
  },
  db: {}
}));

test('renders app without crashing', () => {
  render(<App />);
  // Teste einfach, dass die App rendert (entweder Loading oder Login)
  const element = screen.getByText(/Lädt...|Nutrition Coach/i);
  expect(element).toBeInTheDocument();
});