import { useState } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, Calendar, Lock, User } from 'lucide-react';
import {
  creditCardFormSchema,
  type CreditCardFormInput,
  type CreditCardFormOutput,
} from '@/validations/payment-forms.schema';
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
} from '../../utils/card-format.utils';

export type CreditCardData = {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
};

export type CreditCardFormProps = {
  onSubmit: (data: CreditCardData) => void;
  onBack?: () => void;
  isLoading?: boolean;
};

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
  const [cvvWarning, setCvvWarning] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreditCardFormInput, undefined, CreditCardFormOutput>({
    resolver: zodResolver(creditCardFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      cardNumber: '',
      expiry: '',
      cvv: '',
      cardholderName: '',
    },
  });

  const cardBrand = detectCardBrand(watch('cardNumber'));

  const onFormSubmit: SubmitHandler<CreditCardFormOutput> = (data) => {
    onSubmit(data);
  };

  return (
    <GlassCard glow={false} className='w-full max-w-lg p-4 sm:p-6'>
      <form onSubmit={handleSubmit(onFormSubmit)} className='relative z-10 flex flex-col gap-5' noValidate>
        <h2 className='font-heading text-xl font-medium text-white'>Payment Details</h2>
        <p className='text-xs text-slate-400'>
          Fields marked with <span className='text-rose-400'>*</span> are mandatory.
        </p>

        <FormField
          label='Card Number'
          htmlFor='card-number'
          error={errors.cardNumber?.message}
          required
        >
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
              <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                <CreditCard className='h-4 w-4 text-slate-400' />
              </IconWrapper>
            </div>
            <Controller
              name='cardNumber'
              control={control}
              render={({ field }) => (
                <Input
                  id='card-number'
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(formatCardNumber(event.target.value))}
                  placeholder='1234 5678 9012 3456'
                  inputMode='numeric'
                  autoComplete='cc-number'
                  aria-invalid={Boolean(errors.cardNumber)}
                  className={cn(
                    'pl-12 pr-16 min-h-[44px]',
                    errors.cardNumber && 'border-rose-500/50',
                  )}
                />
              )}
            />
            <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
              <CardBrandBadge brand={cardBrand} />
            </div>
          </div>
        </FormField>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <FormField label='Expiration' htmlFor='card-expiry' error={errors.expiry?.message} required>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
                <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                  <Calendar className='h-4 w-4 text-slate-400' />
                </IconWrapper>
              </div>
              <Controller
                name='expiry'
                control={control}
                render={({ field }) => (
                  <Input
                    id='card-expiry'
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(formatExpiry(event.target.value))}
                    placeholder='MM/YY'
                    inputMode='numeric'
                    autoComplete='cc-exp'
                    aria-invalid={Boolean(errors.expiry)}
                    className={cn('pl-12 min-h-[44px]', errors.expiry && 'border-rose-500/50')}
                  />
                )}
              />
            </div>
          </FormField>

          <FormField label='CVV' htmlFor='card-cvv' error={errors.cvv?.message} required>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
                <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                  <Lock className='h-4 w-4 text-slate-400' />
                </IconWrapper>
              </div>
              <Controller
                name='cvv'
                control={control}
                render={({ field }) => (
                  <Input
                    id='card-cvv'
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(event) => {
                      const rawValue = event.target.value;
                      const hasNonDigits = /[^0-9]/.test(rawValue);
                      setCvvWarning(hasNonDigits ? 'CVV must contain only numbers.' : null);
                      field.onChange(formatCvv(rawValue));
                    }}
                    placeholder='123'
                    inputMode='numeric'
                    autoComplete='cc-csc'
                    aria-invalid={Boolean(errors.cvv)}
                    className={cn('pl-12 min-h-[44px]', errors.cvv && 'border-rose-500/50')}
                  />
                )}
              />
            </div>
            {cvvWarning && <p className='text-xs text-amber-300'>{cvvWarning}</p>}
          </FormField>
        </div>

        <FormField
          label='Cardholder Name'
          htmlFor='card-name'
          error={errors.cardholderName?.message}
          required
        >
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
              <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                <User className='h-4 w-4 text-slate-400' />
              </IconWrapper>
            </div>
            <Input
              id='card-name'
              {...register('cardholderName')}
              placeholder='John Doe'
              autoComplete='cc-name'
              aria-invalid={Boolean(errors.cardholderName)}
              className={cn(
                'pl-12 min-h-[44px]',
                errors.cardholderName && 'border-rose-500/50',
              )}
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
