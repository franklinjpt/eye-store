import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Mail, Phone, User, Building2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/form-field';
import { IconWrapper } from '@/components/ui/IconWrapper';
import { cn } from '@/components/ui/cn';
import type { DeliveryInfo } from '@/types';
import {
  deliveryFormSchema,
  type DeliveryFormInput,
  type DeliveryFormOutput,
} from '@/validations/payment-forms.schema';

export type DeliveryFormProps = {
  onSubmit: (info: DeliveryInfo) => void;
  onBack: () => void;
  initialValues?: DeliveryInfo | null;
};

export function DeliveryForm({ onSubmit, onBack, initialValues }: DeliveryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveryFormInput, undefined, DeliveryFormOutput>({
    resolver: zodResolver(deliveryFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      fullName: initialValues?.fullName ?? '',
      email: initialValues?.email ?? '',
      address: initialValues?.address ?? '',
      city: initialValues?.city ?? '',
      phone: initialValues?.phone ?? '',
    },
  });

  const onFormSubmit: SubmitHandler<DeliveryFormOutput> = (data) => {
    onSubmit(data);
  };

  return (
    <GlassCard glow={false} className='w-full max-w-lg p-4 sm:p-6'>
      <form onSubmit={handleSubmit(onFormSubmit)} className='relative z-10 flex flex-col gap-5' noValidate>
        <h2 className='font-heading text-xl font-medium text-white'>Delivery Information</h2>
        <p className='text-xs text-slate-400'>
          Fields marked with <span className='text-rose-400'>*</span> are mandatory.
        </p>

        <FormField label='Full Name' htmlFor='delivery-name' error={errors.fullName?.message} required>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
              <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                <User className='h-4 w-4 text-slate-400' />
              </IconWrapper>
            </div>
            <Input
              id='delivery-name'
              {...register('fullName')}
              placeholder='John Doe'
              autoComplete='name'
              aria-invalid={Boolean(errors.fullName)}
              className={cn('pl-12 min-h-[44px]', errors.fullName && 'border-rose-500/50')}
            />
          </div>
        </FormField>

        <FormField label='Email' htmlFor='delivery-email' error={errors.email?.message} required>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
              <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                <Mail className='h-4 w-4 text-slate-400' />
              </IconWrapper>
            </div>
            <Input
              id='delivery-email'
              type='email'
              {...register('email')}
              placeholder='john@example.com'
              autoComplete='email'
              aria-invalid={Boolean(errors.email)}
              className={cn('pl-12 min-h-[44px]', errors.email && 'border-rose-500/50')}
            />
          </div>
        </FormField>

        <FormField label='Address' htmlFor='delivery-address' error={errors.address?.message} required>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
              <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                <MapPin className='h-4 w-4 text-slate-400' />
              </IconWrapper>
            </div>
            <Input
              id='delivery-address'
              {...register('address')}
              placeholder='Calle 123 #45-67'
              autoComplete='street-address'
              aria-invalid={Boolean(errors.address)}
              className={cn('pl-12 min-h-[44px]', errors.address && 'border-rose-500/50')}
            />
          </div>
        </FormField>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <FormField label='City' htmlFor='delivery-city' error={errors.city?.message} required>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
                <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                  <Building2 className='h-4 w-4 text-slate-400' />
                </IconWrapper>
              </div>
              <Input
                id='delivery-city'
                {...register('city')}
                placeholder='Bogota'
                autoComplete='address-level2'
                aria-invalid={Boolean(errors.city)}
                className={cn('pl-12 min-h-[44px]', errors.city && 'border-rose-500/50')}
              />
            </div>
          </FormField>

          <FormField label='Phone' htmlFor='delivery-phone' error={errors.phone?.message} required>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
                <IconWrapper className='h-7 w-7 border-none bg-transparent p-1'>
                  <Phone className='h-4 w-4 text-slate-400' />
                </IconWrapper>
              </div>
              <Input
                id='delivery-phone'
                {...register('phone')}
                placeholder='300 123 4567'
                inputMode='tel'
                autoComplete='tel'
                aria-invalid={Boolean(errors.phone)}
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
