import { Test, TestingModule } from '@nestjs/testing';
import { err, ok } from '../../../common/result';
import { ProductType } from '../../../products/domain/models/product-type.enum';
import { ProductRepositoryPort } from '../../../products/domain/ports/outbound/product-repository.port';
import { PRODUCT_REPOSITORY_PORT } from '../../../products/products.tokens';
import { TransactionStatus } from '../../domain/models/transaction-status.enum';
import { GetTransactionUseCase } from '../../domain/ports/inbound/get-transaction.use-case';
import { GetTransactionViewService } from '../../domain/services/get-transaction-view.service';
import { GET_TRANSACTION_USE_CASE } from '../../transactions.tokens';

describe('GetTransactionViewService', () => {
  let service: GetTransactionViewService;
  let getTransactionUseCase: jest.Mocked<GetTransactionUseCase>;
  let productRepository: jest.Mocked<ProductRepositoryPort>;

  beforeEach(async () => {
    const mockGetTransactionUseCase: jest.Mocked<GetTransactionUseCase> = {
      execute: jest.fn(),
    };
    const mockProductRepository: jest.Mocked<ProductRepositoryPort> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      count: jest.fn(),
      saveMany: jest.fn(),
      decrementStock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTransactionViewService,
        {
          provide: GET_TRANSACTION_USE_CASE,
          useValue: mockGetTransactionUseCase,
        },
        { provide: PRODUCT_REPOSITORY_PORT, useValue: mockProductRepository },
      ],
    }).compile();

    service = module.get(GetTransactionViewService);
    getTransactionUseCase = module.get(GET_TRANSACTION_USE_CASE);
    productRepository = module.get(PRODUCT_REPOSITORY_PORT);
  });

  it('should return enriched transaction view when transaction exists', async () => {
    getTransactionUseCase.execute.mockResolvedValue(
      ok({
        id: 'tx-1',
        productId: 'product-1',
        amountInCents: 1000,
        currency: 'COP',
        status: TransactionStatus.APPROVED,
        wompiTransactionId: 'wompi-1',
        reference: 'REF-1',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        deliveryAddress: 'Street 123',
        deliveryCity: 'Bogota',
        customerPhone: '3001234567',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    productRepository.findById.mockResolvedValue({
      id: 'product-1',
      name: 'Blue Frame',
      price: 100,
      description: 'test',
      type: ProductType.FRAME,
      stock: 3,
      position: 1,
      sku: 'SKU-1',
      image: 'https://example.com/image.jpg',
    });

    const result = await service.execute('tx-1');

    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.productName).toBe('Blue Frame');
    }
  });

  it('should return Unknown Product when product lookup fails', async () => {
    getTransactionUseCase.execute.mockResolvedValue(
      ok({
        id: 'tx-1',
        productId: 'product-1',
        amountInCents: 1000,
        currency: 'COP',
        status: TransactionStatus.APPROVED,
        wompiTransactionId: 'wompi-1',
        reference: 'REF-1',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        deliveryAddress: 'Street 123',
        deliveryCity: 'Bogota',
        customerPhone: '3001234567',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    productRepository.findById.mockResolvedValue(null);

    const result = await service.execute('tx-1');

    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.productName).toBe('Unknown Product');
    }
  });

  it('should propagate base get transaction failure', async () => {
    getTransactionUseCase.execute.mockResolvedValue(
      err({
        code: 'TRANSACTION_NOT_FOUND',
        message: 'Transaction with id "tx-1" not found',
      }),
    );

    const result = await service.execute('tx-1');

    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.code).toBe('TRANSACTION_NOT_FOUND');
    }
  });
});
