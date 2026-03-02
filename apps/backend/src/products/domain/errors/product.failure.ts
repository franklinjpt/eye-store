export type ProductFailure = {
  code: 'PRODUCT_NOT_FOUND';
  message: string;
};

export const productNotFoundFailure = (id: string): ProductFailure => ({
  code: 'PRODUCT_NOT_FOUND',
  message: `Product with id "${id}" not found`,
});
