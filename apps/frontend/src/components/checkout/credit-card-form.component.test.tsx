import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreditCardForm } from './credit-card-form.component';

describe('CreditCardForm', () => {
  it('should show required marker on mandatory labels', () => {
    render(<CreditCardForm onSubmit={vi.fn()} />);

    const cardNumberLabel = screen.getByText(/Card Number/i, { selector: 'label' });
    const expiryLabel = screen.getByText(/Expiration/i, { selector: 'label' });
    const cvvLabel = screen.getByText(/CVV/i, { selector: 'label' });
    const cardholderLabel = screen.getByText(/Cardholder Name/i, { selector: 'label' });

    expect(cardNumberLabel.textContent).toContain('*');
    expect(expiryLabel.textContent).toContain('*');
    expect(cvvLabel.textContent).toContain('*');
    expect(cardholderLabel.textContent).toContain('*');
  });

  it('should show field error when card number is blurred empty', async () => {
    const user = userEvent.setup();
    render(<CreditCardForm onSubmit={vi.fn()} />);

    const cardNumberInput = screen.getByLabelText(/Card Number/i);
    await user.click(cardNumberInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('This field is required')).toBeTruthy();
    });
  });

  it('should block letters in cvv and show warning', async () => {
    const user = userEvent.setup();
    render(<CreditCardForm onSubmit={vi.fn()} />);

    const cvvInput = screen.getByLabelText(/CVV/i) as HTMLInputElement;
    await user.type(cvvInput, '1a');

    expect(cvvInput.value).toBe('1');
    expect(screen.getByText('CVV must contain only numbers.')).toBeTruthy();
  });

  it('should submit sanitized payment data when form is valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CreditCardForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Card Number/i), '4242424242424242');
    await user.type(screen.getByLabelText(/Expiration/i), '1299');
    await user.type(screen.getByLabelText(/CVV/i), '123');
    await user.type(screen.getByLabelText(/Cardholder Name/i), '  John Doe  ');
    await user.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith({
        cardNumber: '4242424242424242',
        expiry: '12/99',
        cvv: '123',
        cardholderName: 'John Doe',
      });
    });
  });
});
