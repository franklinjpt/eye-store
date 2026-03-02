import { useState, type FormEvent } from 'react';
import { MapPin, Mail, Phone, User, Building2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/form-field';
import { IconWrapper } from '@/components/ui/IconWrapper';
import { cn } from '@/components/ui/cn';
import type { DeliveryInfo } from '@/types';

export interface DeliveryFormProps {
  onSubmit: (info: DeliveryInfo) => void;
  onBack: () => void;
  initialValues?: DeliveryInfo | null;
}

type FormErrors = Partial<Record<keyof DeliveryInfo, string>>;

function validate(info: DeliveryInfo): FormErrors {
  const errors: FormErrors = {};
  if (!info.fullName.trim()) errors.fullName = 'Full name is required';
  if (!info.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) errors.email = 'Invalid email';
  if (!info.address.trim()) errors.address = 'Address is required';
  if (!info.city.trim()) errors.city = 'City is required';
  if (!info.phone.trim()) errors.phone = 'Phone is required';
  return errors;
}

export function DeliveryForm({ onSubmit, onBack, initialValues }: DeliveryFormProps) {
  const [fullName, setFullName] = useState(initialValues?.fullName ?? '');
  const [email, setEmail] = useState(initialValues?.email ?? '');
  const [address, setAddress] = useState(initialValues?.address ?? '');
  const [city, setCity] = useState(initialValues?.city ?? '');
  const [phone, setPhone] = useState(initialValues?.phone ?? '');
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const info: DeliveryInfo = {
      fullName: fullName.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      phone: phone.trim(),
    };
    const validationErrors = validate(info);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    onSubmit(info);
  }

  return (
    <GlassCard glow={false} className='w-full max-w-lg p-4 sm:p-6'>
      <form onSubmit={handleSubmit} className='relative z-10 flex flex-col gap-5'>
        <h2 className='font-heading text-xl font-medium text-white'>Delivery Information</h2>

        <FormField label='Full Name' htmlFor='delivery-name' error={errors.fullName}>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
              <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                <User className='h-4 w-4 text-slate-400' />
              </IconWrapper>
            </div>
            <Input
              id='delivery-name'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder='John Doe'
              autoComplete='name'
              className={cn('pl-12 min-h-[44px]', errors.fullName && 'border-rose-500/50')}
            />
          </div>
        </FormField>

        <FormField label='Email' htmlFor='delivery-email' error={errors.email}>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
              <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                <Mail className='h-4 w-4 text-slate-400' />
              </IconWrapper>
            </div>
            <Input
              id='delivery-email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='john@example.com'
              autoComplete='email'
              className={cn('pl-12 min-h-[44px]', errors.email && 'border-rose-500/50')}
            />
          </div>
        </FormField>

        <FormField label='Address' htmlFor='delivery-address' error={errors.address}>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
              <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                <MapPin className='h-4 w-4 text-slate-400' />
              </IconWrapper>
            </div>
            <Input
              id='delivery-address'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder='Calle 123 #45-67'
              autoComplete='street-address'
              className={cn('pl-12 min-h-[44px]', errors.address && 'border-rose-500/50')}
            />
          </div>
        </FormField>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <FormField label='City' htmlFor='delivery-city' error={errors.city}>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
                <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                  <Building2 className='h-4 w-4 text-slate-400' />
                </IconWrapper>
              </div>
              <Input
                id='delivery-city'
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder='Bogota'
                autoComplete='address-level2'
                className={cn('pl-12 min-h-[44px]', errors.city && 'border-rose-500/50')}
              />
            </div>
          </FormField>

          <FormField label='Phone' htmlFor='delivery-phone' error={errors.phone}>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
                <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                  <Phone className='h-4 w-4 text-slate-400' />
                </IconWrapper>
              </div>
              <Input
                id='delivery-phone'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder='300 123 4567'
                inputMode='tel'
                autoComplete='tel'
                className={cn('pl-12 min-h-[44px]', errors.phone && 'border-rose-500/50')}
              />
            </div>
          </FormField>
        </div>

        <div className='flex flex-col gap-3 pt-2 sm:flex-row-reverse'>
          <Button type='submit' variant='primary' className='min-h-[44px] flex-1'>
            Continue to Summary
          </Button>
          <Button
            type='button'
            variant='glass'
            onClick={onBack}
            className='min-h-[44px] flex-1'
          >
            Back
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
