import { Test, TestingModule } from '@nestjs/testing';
import { err, ok } from '../../../common/result';
import { ProductType } from '../../../products/domain/models/product-type.enum';
import { ProductRepositoryPort } from '../../../products/domain/ports/outbound/product-repository.port';
import { PRODUCT_REPOSITORY_PORT } from '../../../products/products.tokens';
import { TransactionStatus } from '../../domain/models/transaction-status.enum';
import { CreateTransactionUseCase } from '../../domain/ports/inbound/create-transaction.use-case';
import { CreateTransactionViewService } from '../../domain/services/create-transaction-view.service';
import { CREATE_TRANSACTION_USE_CASE } from '../../transactions.tokens';

describe('CreateTransactionViewService', () => {
  let service: CreateTransactionViewService;
  let createTransactionUseCase: jest.Mocked<CreateTransactionUseCase>;
  let productRepository: jest.Mocked<ProductRepositoryPort>;

  beforeEach(async () => {
    const mockCreateTransactionUseCase: jest.Mocked<CreateTransactionUseCase> = {
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
        CreateTransactionViewService,
        {
          provide: CREATE_TRANSACTION_USE_CASE,
          useValue: mockCreateTransactionUseCase,
        },
        { provide: PRODUCT_REPOSITORY_PORT, useValue: mockProductRepository },
      ],
    }).compile();

    service = module.get(CreateTransactionViewService);
    createTransactionUseCase = module.get(CREATE_TRANSACTION_USE_CASE);
    productRepository = module.get(PRODUCT_REPOSITORY_PORT);
  });

  it('should enrich created transaction with product name', async () => {
    createTransactionUseCase.execute.mockResolvedValue(
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

    const result = await service.execute({
      productId: 'product-1',
      tokenId: 'tok',
      acceptanceToken: 'accept',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      deliveryAddress: 'Street 123',
      deliveryCity: 'Bogota',
      customerPhone: '3001234567',
    });

    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.productName).toBe('Blue Frame');
    }
  });

  it('should return Unknown Product when product lookup fails', async () => {
    createTransactionUseCase.execute.mockResolvedValue(
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

    const result = await service.execute({
      productId: 'product-1',
      tokenId: 'tok',
      acceptanceToken: 'accept',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      deliveryAddress: 'Street 123',
      deliveryCity: 'Bogota',
      customerPhone: '3001234567',
    });

    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.productName).toBe('Unknown Product');
    }
  });

  it('should propagate transaction creation failure', async () => {
    createTransactionUseCase.execute.mockResolvedValue(
      err({
        code: 'PAYMENT_GATEWAY_ERROR',
        message: 'Payment gateway error',
      }),
    );

    const result = await service.execute({
      productId: 'product-1',
      tokenId: 'tok',
      acceptanceToken: 'accept',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      deliveryAddress: 'Street 123',
      deliveryCity: 'Bogota',
      customerPhone: '3001234567',
    });

    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.code).toBe('PAYMENT_GATEWAY_ERROR');
    }
  });
});
