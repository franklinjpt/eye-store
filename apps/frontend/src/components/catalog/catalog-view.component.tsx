import { useEffect } from 'react';
import { ProductCard } from '@/components/product/product-card.component';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadProducts } from '@/store/slices/products.slice';
import { selectProduct } from '@/store/slices/checkout.slice';
import type { Product } from '@/types';

export function CatalogView() {
  const dispatch = useAppDispatch();
  const { items: products, loading, error } = useAppSelector((s) => s.products);

  useEffect(() => {
    if (products.length === 0) {
      dispatch(loadProducts());
    }
  }, [dispatch, products.length]);

  function handleBuy(productId: string) {
    dispatch(selectProduct(productId));
  }

  return (
    <div className='min-h-screen bg-transparent selection:bg-primary selection:text-white pb-24'>
      {/* Header */}
      <header className='fixed top-0 z-40 w-full border-b border-white/10 bg-base/60 backdrop-blur-xl'>
        <div className='mx-auto flex h-20 max-w-7xl items-center justify-start gap-4 px-6 relative'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-[0_0_15px_var(--color-primary-glow)]'>
              <span className='font-heading font-bold text-white text-lg'>
                B
              </span>
            </div>
            <h1 className='font-heading text-xl font-medium tracking-wide text-white'>
              Bold<span className='text-accent'>Frames</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='mx-auto max-w-7xl px-6 pt-32'>
        {/* Hero Section */}
        <div className='mb-32 mt-12 flex flex-col items-center justify-center text-center relative max-w-4xl mx-auto'>
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none' />

          <div className='relative z-10 mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-300 backdrop-blur-md'>
            <span className='flex h-2 w-2 rounded-full bg-accent animate-pulse' />
            Discover the Aurora Collection
          </div>
          <h2 className='font-heading text-6xl md:text-8xl font-medium leading-[1.1] tracking-tight text-white'>
            Vision, <br />
            <span className='bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient'>
              Refined.
            </span>
          </h2>
          <p className='mt-8 max-w-2xl text-lg text-slate-400 font-sans leading-relaxed'>
            Elevate your perspective with our premium eyewear. Precision-crafted
            frames that merge avant-garde aesthetics with unparalleled clarity
            and comfort.
          </p>
        </div>

        {/* Collection Header */}
        <div className='mb-12 flex items-end justify-between border-b border-white/10 pb-4'>
          <h2 className='font-heading text-3xl font-medium text-white'>
            Latest Arrivals
          </h2>
          <span className='text-sm text-slate-400 uppercase tracking-widest'>
            {products.length} Styles
          </span>
        </div>

        {/* Loading / Error / Grid */}
        {loading && (
          <div className='flex justify-center py-20'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
          </div>
        )}

        {error && (
          <div className='rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center'>
            <p className='text-rose-400'>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {products.map((product: Product) => (
              <ProductCard
                key={product.id}
                product={product}
                onBuy={() => handleBuy(product.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
