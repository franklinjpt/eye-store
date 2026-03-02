import { useState, type FormEvent } from 'react';
import { CreditCard, Calendar, Lock, User } from 'lucide-react';
import { GlassCard } from '../ui/glass-card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { FormField } from '../ui/form-field';
import { IconWrapper } from '../ui/IconWrapper';
import { cn } from '../ui/cn';
import {
  formatCardNumber,
  formatExpiry,
  formatCvv,
  isValidLuhn,
  isValidExpiry,
} from '../../utils/card-format.utils';

export interface CreditCardData {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
}

export interface CreditCardFormProps {
  onSubmit: (data: CreditCardData) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

interface FormErrors {
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  cardholderName?: string;
}

type CardBrand = 'visa' | 'mastercard' | null;

function detectCardBrand(number: string): CardBrand {
  const digits = number.replace(/\s/g, '');
  if (!digits) return null;

  // VISA: starts with 4
  if (/^4/.test(digits)) return 'visa';

  // MasterCard: starts with 51-55 or 2221-2720
  const twoDigit = parseInt(digits.slice(0, 2), 10);
  const fourDigit = parseInt(digits.slice(0, 4), 10);
  if ((twoDigit >= 51 && twoDigit <= 55) || (fourDigit >= 2221 && fourDigit <= 2720)) {
    return 'mastercard';
  }

  return null;
}

function validate(
  cardNumber: string,
  expiry: string,
  cvv: string,
  cardholderName: string,
): FormErrors {
  const errors: FormErrors = {};

  if (!cardNumber.replace(/\s/g, '')) {
    errors.cardNumber = 'Card number is required';
  } else if (!isValidLuhn(cardNumber)) {
    errors.cardNumber = 'Invalid card number';
  }

  if (!expiry) {
    errors.expiry = 'Expiration is required';
  } else if (!isValidExpiry(expiry)) {
    errors.expiry = 'Invalid or expired date';
  }

  const cvvDigits = cvv.replace(/\D/g, '');
  if (!cvvDigits) {
    errors.cvv = 'CVV is required';
  } else if (cvvDigits.length < 3) {
    errors.cvv = 'CVV must be 3-4 digits';
  }

  if (!cardholderName.trim()) {
    errors.cardholderName = 'Cardholder name is required';
  }

  return errors;
}

function CardBrandBadge({ brand }: { brand: CardBrand }) {
  if (!brand) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tracking-wider uppercase',
        brand === 'visa' && 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
        brand === 'mastercard' && 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
      )}
    >
      {brand === 'visa' ? 'VISA' : 'MC'}
    </span>
  );
}

export function CreditCardForm({ onSubmit, onBack, isLoading }: CreditCardFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const cardBrand = detectCardBrand(cardNumber);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validationErrors = validate(cardNumber, expiry, cvv, cardholderName);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    onSubmit({
      cardNumber: cardNumber.replace(/\s/g, ''),
      expiry,
      cvv,
      cardholderName: cardholderName.trim(),
    });
  }

  return (
    <GlassCard glow={false} className='w-full max-w-lg'>
      <form onSubmit={handleSubmit} className='relative z-10 flex flex-col gap-5'>
        <h2 className='font-heading text-xl font-medium text-white'>Payment Details</h2>

        <FormField label='Card Number' htmlFor='card-number' error={errors.cardNumber}>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
              <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                <CreditCard className='h-4 w-4 text-slate-400' />
              </IconWrapper>
            </div>
            <Input
              id='card-number'
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder='1234 5678 9012 3456'
              inputMode='numeric'
              autoComplete='cc-number'
              className={cn('pl-12 pr-16 min-h-[44px]', errors.cardNumber && 'border-rose-500/50')}
            />
            <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
              <CardBrandBadge brand={cardBrand} />
            </div>
          </div>
        </FormField>

        <div className='grid grid-cols-2 gap-4'>
          <FormField label='Expiration' htmlFor='card-expiry' error={errors.expiry}>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
                <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                  <Calendar className='h-4 w-4 text-slate-400' />
                </IconWrapper>
              </div>
              <Input
                id='card-expiry'
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder='MM/YY'
                inputMode='numeric'
                autoComplete='cc-exp'
                className={cn('pl-12 min-h-[44px]', errors.expiry && 'border-rose-500/50')}
              />
            </div>
          </FormField>

          <FormField label='CVV' htmlFor='card-cvv' error={errors.cvv}>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
                <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                  <Lock className='h-4 w-4 text-slate-400' />
                </IconWrapper>
              </div>
              <Input
                id='card-cvv'
                value={cvv}
                onChange={(e) => setCvv(formatCvv(e.target.value))}
                placeholder='123'
                inputMode='numeric'
                autoComplete='cc-csc'
                className={cn('pl-12 min-h-[44px]', errors.cvv && 'border-rose-500/50')}
              />
            </div>
          </FormField>
        </div>

        <FormField label='Cardholder Name' htmlFor='card-name' error={errors.cardholderName}>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
              <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                <User className='h-4 w-4 text-slate-400' />
              </IconWrapper>
            </div>
            <Input
              id='card-name'
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder='John Doe'
              autoComplete='cc-name'
              className={cn('pl-12 min-h-[44px]', errors.cardholderName && 'border-rose-500/50')}
            />
          </div>
        </FormField>

        <div className='flex flex-col gap-3 pt-2 sm:flex-row-reverse'>
          <Button
            type='submit'
            variant='primary'
            disabled={isLoading}
            className='min-h-[44px] flex-1'
          >
            {isLoading ? 'Processing...' : 'Continue'}
          </Button>
          {onBack && (
            <Button
              type='button'
              variant='glass'
              onClick={onBack}
              className='min-h-[44px] flex-1'
            >
              Cancel
            </Button>
          )}
        </div>

        <p className='text-center text-xs text-slate-500'>
          Secured by WOMPI. Card data is never stored.
        </p>
      </form>
    </GlassCard>
  );
}
