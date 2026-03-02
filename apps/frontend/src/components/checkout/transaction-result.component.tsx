import type { TransactionStatus } from '@/types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/Button';
import { useAppDispatch, useAppSelector } from '@/store';
import { resetCheckout } from '@/store/slices/checkout.slice';
import { loadProducts } from '@/store/slices/products.slice';

const STATUS_CONFIG = {
  APPROVED: {
    icon: CheckCircle2,
    title: 'Payment Successful',
    subtitle: 'Your order has been confirmed',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/20',
  },
  DECLINED: {
    icon: XCircle,
    title: 'Payment Declined',
    subtitle: 'Your card was not accepted',
    color: 'text-rose-400',
    bgColor: 'bg-rose-400/10',
    borderColor: 'border-rose-400/20',
  },
  ERROR: {
    icon: AlertTriangle,
    title: 'Payment Error',
    subtitle: 'Something went wrong with your payment',
    color: 'text-rose-400',
    bgColor: 'bg-rose-400/10',
    borderColor: 'border-rose-400/20',
  },
  PENDING: {
    icon: Clock,
    title: 'Payment Pending',
    subtitle: 'Your payment is being processed',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    borderColor: 'border-amber-400/20',
  },
  VOIDED: {
    icon: XCircle,
    title: 'Payment Voided',
    subtitle: 'Your payment has been cancelled',
    color: 'text-slate-400',
    bgColor: 'bg-slate-400/10',
    borderColor: 'border-slate-400/20',
  },
} as const;

export function TransactionResultView() {
  const dispatch = useAppDispatch();
  const result = useAppSelector((s) => s.checkout.transactionResult);
  const error = useAppSelector((s) => s.checkout.error);
  const isPolling = useAppSelector((s) => s.checkout.isPolling);

  function handleBackToStore() {
    dispatch(resetCheckout());
    dispatch(loadProducts());
  }

  if (!result) return null;

  const statusKey = result.status as TransactionStatus;
  const config = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.ERROR;
  const Icon = config.icon;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
      <GlassCard glow={false} className='w-full max-w-md'>
        <div className='relative z-10 flex flex-col items-center gap-6 text-center'>
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full ${config.bgColor} ${config.borderColor} border`}
          >
            <Icon className={`h-10 w-10 ${config.color}`} />
          </div>

          <div>
            <h2 className='font-heading text-2xl font-medium text-white'>
              {config.title}
            </h2>
            <p className='mt-1 text-slate-400'>{config.subtitle}</p>
          </div>

          {/* Polling indicator — shown while we're waiting for a final status */}
          {isPolling && (
            <div className='flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm text-amber-300'>
              <Loader2 className='h-4 w-4 animate-spin' />
              <span>Waiting for payment confirmation…</span>
            </div>
          )}

          {result.reference && (
            <div className='w-full rounded-xl border border-white/10 bg-white/5 p-4'>
              <p className='text-sm text-slate-400'>Transaction Reference</p>
              <p className='font-mono text-lg font-medium text-white'>
                {result.reference}
              </p>
              {result.productName && (
                <p className='mt-2 text-sm text-slate-300'>
                  {result.productName}
                </p>
              )}
            </div>
          )}

          {error && <p className='text-sm text-rose-400'>{error}</p>}

          <Button
            variant='primary'
            onClick={handleBackToStore}
            disabled={isPolling}
            className='min-h-[44px] w-full'
          >
            {isPolling ? 'Waiting for confirmation…' : 'Back to Store'}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
