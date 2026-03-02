import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { Product } from '@/types';
import { ProductCard } from './product-card.component';

const addToCartRenderSpy = vi.fn();

vi.mock('../ui/glass-card', () => ({
  GlassCard: ({ children }: { children: ReactNode }) => (
    <div data-testid='glass-card'>{children}</div>
  ),
}));

vi.mock('./product-image.component', () => ({
  ProductImage: () => <div data-testid='product-image' />,
}));

vi.mock('./product-info.component', () => ({
  ProductInfo: ({ name }: { name: string }) => <div>{name}</div>,
}));

vi.mock('./add-to-cart-button.component', () => ({
  AddToCartButton: ({
    disabled,
    label,
    onClick,
  }: {
    disabled: boolean;
    label: string;
    onClick: () => void;
  }) => {
    addToCartRenderSpy();
    return (
      <button type='button' disabled={disabled} onClick={onClick}>
        {label}
      </button>
    );
  },
}));

function createProduct(overrides?: Partial<Product>): Product {
  return {
    id: 'product-1',
    name: 'Blue Frame',
    price: 120000,
    stock: 5,
    position: 1,
    description: 'Comfortable frame',
    type: 'FRAME',
    sku: 'SKU-1',
    image: 'https://example.com/frame.jpg',
    ...overrides,
  };
}

describe('ProductCard', () => {
  it('should skip rerender when props are referentially stable', () => {
    addToCartRenderSpy.mockClear();
    const onBuy = vi.fn();
    const product = createProduct();

    const { rerender } = render(<ProductCard product={product} onBuy={onBuy} />);
    expect(addToCartRenderSpy).toHaveBeenCalledTimes(1);

    rerender(<ProductCard product={product} onBuy={onBuy} />);
    expect(addToCartRenderSpy).toHaveBeenCalledTimes(1);
  });

  it('should rerender when the product prop changes', () => {
    addToCartRenderSpy.mockClear();
    const onBuy = vi.fn();
    const product = createProduct();

    const { rerender } = render(<ProductCard product={product} onBuy={onBuy} />);
    expect(addToCartRenderSpy).toHaveBeenCalledTimes(1);

    rerender(
      <ProductCard product={createProduct({ stock: 0 })} onBuy={onBuy} />,
    );
    expect(addToCartRenderSpy).toHaveBeenCalledTimes(2);
  });

  it('should call onBuy with product id when button is clicked', async () => {
    const user = userEvent.setup();
    const onBuy = vi.fn();
    const product = createProduct();

    render(<ProductCard product={product} onBuy={onBuy} />);
    await user.click(screen.getByRole('button', { name: /pay with credit card/i }));

    expect(onBuy).toHaveBeenCalledWith('product-1');
  });
});
