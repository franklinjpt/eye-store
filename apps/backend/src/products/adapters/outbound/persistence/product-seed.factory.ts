import { Product } from '../../../domain/models/product';
import { ProductType } from '../../../domain/models/product-type.enum';

export const SEED_PRODUCT_COUNT = 25;

const PRODUCT_TYPES: ProductType[] = [
  ProductType.FRAME,
  ProductType.LENS,
  ProductType.ACCESSORY,
];

const FRAME_IMAGE_URL = 'https://i.postimg.cc/WbmZKdf0/natue-glasses.jpg';
const LENS_IMAGE_URL = 'https://i.postimg.cc/150FT8YF/linconl-eye-glasess.jpg';
const ACCESSORY_IMAGE_URL = 'https://i.postimg.cc/jdYNZHvL/eye-drop.jpg';

const FRAME_PREFIXES = [
  'Classic',
  'Modern',
  'Premium',
  'Lightweight',
  'Bold',
  'Refined',
];
const FRAME_STYLES = [
  'Aviator Frame',
  'Square Frame',
  'Round Frame',
  'Rimless Frame',
  'Titanium Frame',
  'Retro Frame',
];

const LENS_PREFIXES = [
  'Crystal',
  'Ultra',
  'Precision',
  'Blue Shield',
  'Daily Comfort',
  'ClearView',
];
const LENS_STYLES = [
  'Glasses Lens',
  'Anti-Glare Lens',
  'Blue-Light Lens',
  'Progressive Lens',
  'Reading Lens',
  'Photochromic Lens',
];

const ACCESSORY_PREFIXES = [
  'Hydra',
  'Relief',
  'Soothing',
  'Comfort',
  'Refresh',
  'PureVision',
];
const ACCESSORY_STYLES = [
  'Eye Drops',
  'Lubricating Eye Drops',
  'Dry Eye Drops',
  'Moisturizing Eye Drops',
  'Sensitive Eye Drops',
  'Hydrating Eye Drops',
];

const TYPE_PRICE_RANGES: Record<ProductType, { min: number; max: number }> = {
  [ProductType.FRAME]: { min: 89000, max: 249000 },
  [ProductType.LENS]: { min: 49000, max: 179000 },
  [ProductType.ACCESSORY]: { min: 8000, max: 32000 },
};

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function generateRandomName(type: ProductType): string {
  switch (type) {
    case ProductType.FRAME:
      return `${pickRandom(FRAME_PREFIXES)} ${pickRandom(FRAME_STYLES)}`;
    case ProductType.LENS:
      return `${pickRandom(LENS_PREFIXES)} ${pickRandom(LENS_STYLES)}`;
    case ProductType.ACCESSORY:
      return `${pickRandom(ACCESSORY_PREFIXES)} ${pickRandom(ACCESSORY_STYLES)}`;
    default:
      return 'Optical Product';
  }
}

function generateRandomPrice(type: ProductType): number {
  const range = TYPE_PRICE_RANGES[type];
  const price = Math.random() * (range.max - range.min) + range.min;
  return Math.round(price);
}

function generateRandomImage(type: ProductType): string {
  switch (type) {
    case ProductType.FRAME:
      return FRAME_IMAGE_URL;
    case ProductType.LENS:
      return LENS_IMAGE_URL;
    case ProductType.ACCESSORY:
      return ACCESSORY_IMAGE_URL;
    default:
      return FRAME_IMAGE_URL;
  }
}

function generateRandomStock(type: ProductType): number {
  switch (type) {
    case ProductType.FRAME:
      return Math.floor(Math.random() * 25) + 1;
    case ProductType.LENS:
      return Math.floor(Math.random() * 25) + 1;
    case ProductType.ACCESSORY:
      return Math.floor(Math.random() * 25) + 1;
    default:
      return 1;
  }
}

function generateDescription(type: ProductType): string {
  switch (type) {
    case ProductType.FRAME:
      return 'Durable optical frame with comfortable fit for all-day wear.';
    case ProductType.LENS:
      return 'High-clarity lens designed to reduce glare and improve visual comfort.';
    case ProductType.ACCESSORY:
      return 'Moisturizing eye drop formula to help soothe dry and irritated eyes.';
    default:
      return 'Quality optical product for everyday eye care.';
  }
}

function generateSku(type: ProductType, index: number): string {
  const prefixByType: Record<ProductType, string> = {
    [ProductType.FRAME]: 'FRM',
    [ProductType.LENS]: 'LNS',
    [ProductType.ACCESSORY]: 'ACC',
  };
  const paddedIndex = String(index).padStart(3, '0');
  return `${prefixByType[type]}-RND-${paddedIndex}`;
}

export function generateSeedProducts(
  count: number,
  startIndex = 1,
): Omit<Product, 'id'>[] {
  return Array.from({ length: count }, (_, idx) => {
    const sequenceIndex = startIndex + idx;
    const type = PRODUCT_TYPES[(sequenceIndex - 1) % PRODUCT_TYPES.length];
    return {
      name: generateRandomName(type),
      price: generateRandomPrice(type),
      description: generateDescription(type),
      type,
      stock: generateRandomStock(type),
      sku: generateSku(type, sequenceIndex),
      image: generateRandomImage(type),
    };
  });
}
