import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductController } from '../../adapters/inbound/http/product.controller';
import { GetProductsUseCase } from '../../domain/ports/inbound/get-products.use-case';
import { GetProductByIdUseCase } from '../../domain/ports/inbound/get-product-by-id.use-case';
import {
  GET_PRODUCTS_USE_CASE,
  GET_PRODUCT_BY_ID_USE_CASE,
} from '../../products.tokens';
import { Product } from '../../domain/models/product';
import { ProductType } from '../../domain/models/product-type.enum';

const mockProduct: Product = {
  id: '1',
  name: 'Test Frame',
  price: 99.99,
  description: 'A test frame',
  type: ProductType.FRAME,
  stock: 10,
  position: 1,
  sku: 'FRM-TST-001',
  image: 'https://example.com/frame.jpg',
};

describe('ProductController', () => {
  let controller: ProductController;
  let getProductsUseCase: jest.Mocked<GetProductsUseCase>;
  let getProductByIdUseCase: jest.Mocked<GetProductByIdUseCase>;

  beforeEach(async () => {
    const mockGetProducts: jest.Mocked<GetProductsUseCase> = {
      execute: jest.fn(),
    };
    const mockGetProductById: jest.Mocked<GetProductByIdUseCase> = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        { provide: GET_PRODUCTS_USE_CASE, useValue: mockGetProducts },
        { provide: GET_PRODUCT_BY_ID_USE_CASE, useValue: mockGetProductById },
      ],
    }).compile();

    controller = module.get(ProductController);
    getProductsUseCase = module.get(GET_PRODUCTS_USE_CASE);
    getProductByIdUseCase = module.get(GET_PRODUCT_BY_ID_USE_CASE);
  });

  describe('GET /api/stock', () => {
    it('should return all products', async () => {
      getProductsUseCase.execute.mockResolvedValue([mockProduct]);

      const result = await controller.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockProduct.id);
      expect(result[0].name).toBe(mockProduct.name);
    });
  });

  describe('GET /api/stock/:id', () => {
    it('should return product when found', async () => {
      getProductByIdUseCase.execute.mockResolvedValue(mockProduct);

      const result = await controller.findById('1');

      expect(result.id).toBe(mockProduct.id);
      expect(result.name).toBe(mockProduct.name);
    });

    it('should throw NotFoundException when product not found', async () => {
      getProductByIdUseCase.execute.mockResolvedValue(null);

      await expect(controller.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
