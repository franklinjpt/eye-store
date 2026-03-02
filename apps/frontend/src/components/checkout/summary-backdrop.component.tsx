import type { Product } from '@/types';
import { ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/Button';
import { useAppDispatch, useAppSelector } from '@/store';
import { processPayment, goBackToPayment } from '@/store/slices/checkout.slice';

const BASE_FEE = 2000;
const DELIVERY_FEE = 5000;

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function SummaryBackdrop() {
  const dispatch = useAppDispatch();
  const selectedProductId = useAppSelector((s) => s.checkout.selectedProductId);
  const deliveryInfo = useAppSelector((s) => s.checkout.deliveryInfo);
  const isProcessing = useAppSelector((s) => s.checkout.isProcessing);
  const products = useAppSelector((s) => s.products.items);

  const product = products.find((p: Product) => p.id === selectedProductId);

  if (!product || !deliveryInfo) return null;

  const productPrice = product.price;
  const total = productPrice + BASE_FEE + DELIVERY_FEE;

  function handlePayNow() {
    dispatch(processPayment());
  }

  function handleBack() {
    dispatch(goBackToPayment());
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
      <GlassCard glow={false} className='w-full max-w-md'>
        <div className='relative z-10 flex flex-col gap-6'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20'>
              <ShoppingBag className='h-5 w-5 text-primary' />
            </div>
            <h2 className='font-heading text-xl font-medium text-white'>Order Summary</h2>
          </div>

          {/* Product */}
          <div className='flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4'>
            <img
              src={product.image}
              alt={product.name}
              className='h-16 w-16 rounded-lg object-cover'
              loading='lazy'
            />
            <div className='flex-1'>
              <p className='font-heading font-medium text-white'>{product.name}</p>
              <p className='text-sm text-slate-400'>{product.sku}</p>
            </div>
            <span className='font-sans font-bold text-accent'>{formatCOP(productPrice)}</span>
          </div>

          {/* Fees breakdown */}
          <div className='flex flex-col gap-2 text-sm'>
            <div className='flex justify-between text-slate-300'>
              <span>Product</span>
              <span>{formatCOP(productPrice)}</span>
            </div>
            <div className='flex justify-between text-slate-300'>
              <span>Base Fee</span>
              <span>{formatCOP(BASE_FEE)}</span>
            </div>
            <div className='flex justify-between text-slate-300'>
              <span>Delivery Fee</span>
              <span>{formatCOP(DELIVERY_FEE)}</span>
            </div>
            <div className='my-2 border-t border-white/10' />
            <div className='flex justify-between font-heading text-lg font-medium text-white'>
              <span>Total</span>
              <span className='text-accent'>{formatCOP(total)}</span>
            </div>
          </div>

          {/* Delivery info */}
          <div className='rounded-xl border border-white/10 bg-white/5 p-4 text-sm'>
            <p className='mb-2 font-medium text-slate-300'>Deliver to:</p>
            <p className='text-white'>{deliveryInfo.fullName}</p>
            <p className='text-slate-400'>{deliveryInfo.address}, {deliveryInfo.city}</p>
            <p className='text-slate-400'>{deliveryInfo.email}</p>
            <p className='text-slate-400'>{deliveryInfo.phone}</p>
          </div>

          {/* Actions */}
          <div className='flex flex-col gap-3 sm:flex-row-reverse'>
            <Button
              variant='primary'
              onClick={handlePayNow}
              disabled={isProcessing}
              className='min-h-[44px] flex-1'
            >
              {isProcessing ? (
                <span className='flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Processing...
                </span>
              ) : (
                `Pay ${formatCOP(total)}`
              )}
            </Button>
            <Button
              variant='glass'
              onClick={handleBack}
              disabled={isProcessing}
              className='min-h-[44px] flex-1'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
