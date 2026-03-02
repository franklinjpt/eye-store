import { Test, TestingModule } from '@nestjs/testing';
import { GetProductsService } from '../../domain/services/get-products.service';
import { ProductRepositoryPort } from '../../domain/ports/outbound/product-repository.port';
import { PRODUCT_REPOSITORY_PORT } from '../../products.tokens';
import { Product } from '../../domain/models/product';
import { ProductType } from '../../domain/models/product-type.enum';

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Test Frame',
    price: 99.99,
    description: 'A test frame',
    type: ProductType.FRAME,
    stock: 10,
    sku: 'FRM-TST-001',
    image: 'https://example.com/frame.jpg',
  },
  {
    id: '2',
    name: 'Test Lens',
    price: 49.99,
    description: 'A test lens',
    type: ProductType.LENS,
    stock: 20,
    sku: 'LNS-TST-001',
    image: 'https://example.com/lens.jpg',
  },
];

describe('GetProductsService', () => {
  let service: GetProductsService;
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
        GetProductsService,
        { provide: PRODUCT_REPOSITORY_PORT, useValue: mockRepository },
      ],
    }).compile();

    service = module.get(GetProductsService);
    repository = module.get(PRODUCT_REPOSITORY_PORT);
  });

  it('should return all products', async () => {
    repository.findAll.mockResolvedValue(mockProducts);

    const result = await service.execute();

    expect(result).toEqual(mockProducts);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no products exist', async () => {
    repository.findAll.mockResolvedValue([]);

    const result = await service.execute();

    expect(result).toEqual([]);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });
});
