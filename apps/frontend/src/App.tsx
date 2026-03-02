import { Search } from 'lucide-react';
import { ProductCard, type Product } from './components/product/product-card.component';
import { Input } from './components/ui/Input';

const FAKE_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'The Original Chunky',
    price: 129.99,
    stock: 14,
    description:
      'Our signature thick frames. Perfect circles that make an unapologetic statement. Available in multiple high-contrast colors.',
    imageUrl:
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '2',
    name: 'Neon Horizon',
    price: 145.0,
    stock: 5,
    description:
      'Cyberpunk inspired geometric arches. These frames bring the high-contrast aesthetic to your everyday look.',
    imageUrl:
      'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '3',
    name: 'Violet Vintage',
    price: 110.5,
    stock: 0,
    description:
      'Retro pill-shaped lenses wrapped in a playful, heavy solid border. Timeless yet completely modern.',
    imageUrl:
      'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '4',
    name: 'Amber Arches',
    price: 134.99,
    stock: 22,
    description:
      'Warm amber tones meeting sharp geometric lines. Guaranteed to stand out in a crowd.',
    imageUrl:
      'https://images.unsplash.com/photo-1582142339217-bf482381e592?auto=format&fit=crop&q=80&w=800',
  },
];

function App() {
  return (
    <div className='min-h-screen bg-transparent selection:bg-primary selection:text-white pb-24'>
      {/* Header */}
      <header className='fixed top-0 z-50 w-full border-b border-white/10 bg-base/60 backdrop-blur-xl'>
        <div className='mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-6 relative'>
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

          <div className='hidden max-w-md flex-1 md:block relative'>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 flex items-center pl-4'>
                <Search className='h-5 w-5 text-slate-400' />
              </div>
              <Input
                type='search'
                placeholder='Search collections...'
                className='pl-12 rounded-full h-11 bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 transition-all focus-visible:ring-primary'
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='mx-auto max-w-7xl px-6 pt-32'>
        {/* Mobile Search */}
        <div className='mb-8 md:hidden'>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 flex items-center pl-4'>
              <Search className='h-5 w-5 text-slate-400' />
            </div>
            <Input
              type='search'
              placeholder='Search collections...'
              className='pl-12 rounded-full h-11'
            />
          </div>
        </div>

        {/* Hero Section */}
        <div className='mb-32 mt-12 flex flex-col items-center justify-center text-center relative max-w-4xl mx-auto'>
          {/* Ambient Glow */}
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
            {FAKE_PRODUCTS.length} Styles
          </span>
        </div>

        {/* Product Grid */}
        <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {FAKE_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
