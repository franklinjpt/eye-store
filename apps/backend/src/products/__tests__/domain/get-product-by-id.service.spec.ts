import { Test, TestingModule } from '@nestjs/testing';
import { GetProductByIdService } from '../../domain/services/get-product-by-id.service';
import { ProductRepositoryPort } from '../../domain/ports/outbound/product-repository.port';
import { PRODUCT_REPOSITORY_PORT } from '../../products.tokens';
import { Product } from '../../domain/models/product';
import { ProductType } from '../../domain/models/product-type.enum';

const mockProduct: Product = {
  id: '1',
  name: 'Test Frame',
  price: 99.99,
  description: 'A test frame',
  type: ProductType.FRAME,
  stock: 10,
  sku: 'FRM-TST-001',
  image: 'https://example.com/frame.jpg',
};

describe('GetProductByIdService', () => {
  let service: GetProductByIdService;
  let repository: jest.Mocked<ProductRepositoryPort>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<ProductRepositoryPort> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      count: jest.fn(),
      saveMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductByIdService,
        { provide: PRODUCT_REPOSITORY_PORT, useValue: mockRepository },
      ],
    }).compile();

    service = module.get(GetProductByIdService);
    repository = module.get(PRODUCT_REPOSITORY_PORT);
  });

  it('should return product when found', async () => {
    repository.findById.mockResolvedValue(mockProduct);

    const result = await service.execute('1');

    expect(result).toEqual(mockProduct);
    expect(repository.findById).toHaveBeenCalledWith('1');
  });

  it('should return null when product not found', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await service.execute('non-existent');

    expect(result).toBeNull();
    expect(repository.findById).toHaveBeenCalledWith('non-existent');
  });
});
