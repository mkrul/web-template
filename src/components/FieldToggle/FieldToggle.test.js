import React from 'react';
import { render, screen } from '@testing-library/react';
import { Form as FinalForm } from 'react-final-form';
import FieldToggle from './FieldToggle';

const TestForm = ({ onSubmit = () => {} }) => (
  <FinalForm
    onSubmit={onSubmit}
    render={({ handleSubmit }) => (
      <form onSubmit={handleSubmit}>
        <FieldToggle id="test-toggle" name="testToggle" label="Test Toggle" />
      </form>
    )}
  />
);

describe('FieldToggle', () => {
  it('renders with label', () => {
    render(<TestForm />);
    expect(screen.getByText('Test Toggle')).toBeInTheDocument();
  });

  it('renders toggle element', () => {
    render(<TestForm />);
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeInTheDocument();
  });
});
