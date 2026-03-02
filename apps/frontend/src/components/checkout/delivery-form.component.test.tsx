import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DeliveryForm } from './delivery-form.component';

describe('DeliveryForm', () => {
  it('should show required marker on mandatory labels', () => {
    render(<DeliveryForm onSubmit={vi.fn()} onBack={vi.fn()} />);

    const fullNameLabel = screen.getByText(/Full Name/i, { selector: 'label' });
    const emailLabel = screen.getByText(/Email/i, { selector: 'label' });
    const addressLabel = screen.getByText(/Address/i, { selector: 'label' });
    const cityLabel = screen.getByText(/City/i, { selector: 'label' });
    const phoneLabel = screen.getByText(/Phone/i, { selector: 'label' });

    expect(fullNameLabel.textContent).toContain('*');
    expect(emailLabel.textContent).toContain('*');
    expect(addressLabel.textContent).toContain('*');
    expect(cityLabel.textContent).toContain('*');
    expect(phoneLabel.textContent).toContain('*');
  });

  it('should show invalid email error after blur', async () => {
    const user = userEvent.setup();
    render(<DeliveryForm onSubmit={vi.fn()} onBack={vi.fn()} />);

    await user.type(screen.getByLabelText(/Email/i), 'invalid-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeTruthy();
    });
  });

  it('should block submission with missing required fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<DeliveryForm onSubmit={onSubmit} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Continue to Summary/i }));

    await waitFor(() => {
      expect(screen.getAllByText('This field is required').length).toBeGreaterThan(0);
      expect(onSubmit).toHaveBeenCalledTimes(0);
    });
  });

  it('should submit trimmed delivery info when form is valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<DeliveryForm onSubmit={onSubmit} onBack={vi.fn()} />);

    await user.type(screen.getByLabelText(/Full Name/i), '  Jane Doe  ');
    await user.type(screen.getByLabelText(/Email/i), '  jane@example.com  ');
    await user.type(screen.getByLabelText(/Address/i), '  Calle 123 #45-67 ');
    await user.type(screen.getByLabelText(/City/i), '  Bogota ');
    await user.type(screen.getByLabelText(/Phone/i), ' 3001234567 ');
    await user.click(screen.getByRole('button', { name: /Continue to Summary/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        address: 'Calle 123 #45-67',
        city: 'Bogota',
        phone: '3001234567',
      });
    });
  });
});
