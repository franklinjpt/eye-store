import { Test, TestingModule } from '@nestjs/testing';
import { ProductRepositoryPort } from '../../../products/domain/ports/outbound/product-repository.port';
import { PRODUCT_REPOSITORY_PORT } from '../../../products/products.tokens';
import { TransactionStatus } from '../../domain/models/transaction-status.enum';
import { PaymentGatewayPort } from '../../domain/ports/outbound/payment-gateway.port';
import { TransactionRepositoryPort } from '../../domain/ports/outbound/transaction-repository.port';
import { GetTransactionService } from '../../domain/services/get-transaction.service';
import {
  PAYMENT_GATEWAY_PORT,
  TRANSACTION_REPOSITORY_PORT,
} from '../../transactions.tokens';

describe('GetTransactionService', () => {
  let service: GetTransactionService;
  let transactionRepository: jest.Mocked<TransactionRepositoryPort>;
  let paymentGateway: jest.Mocked<PaymentGatewayPort>;
  let productRepository: jest.Mocked<ProductRepositoryPort>;

  beforeEach(async () => {
    const mockTransactionRepository: jest.Mocked<TransactionRepositoryPort> = {
      save: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      updateStatusFromPending: jest.fn(),
    };
    const mockPaymentGateway: jest.Mocked<PaymentGatewayPort> = {
      createPayment: jest.fn(),
      getTransactionStatus: jest.fn(),
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
        GetTransactionService,
        {
          provide: TRANSACTION_REPOSITORY_PORT,
          useValue: mockTransactionRepository,
        },
        { provide: PAYMENT_GATEWAY_PORT, useValue: mockPaymentGateway },
        { provide: PRODUCT_REPOSITORY_PORT, useValue: mockProductRepository },
      ],
    }).compile();

    service = module.get(GetTransactionService);
    transactionRepository = module.get(TRANSACTION_REPOSITORY_PORT);
    paymentGateway = module.get(PAYMENT_GATEWAY_PORT);
    productRepository = module.get(PRODUCT_REPOSITORY_PORT);
  });

  it('should return TRANSACTION_NOT_FOUND when transaction does not exist', async () => {
    transactionRepository.findById.mockResolvedValue(null);

    const result = await service.execute('tx-missing');

    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.code).toBe('TRANSACTION_NOT_FOUND');
    }
  });

  it('should return transaction as-is when wompi status lookup fails', async () => {
    transactionRepository.findById.mockResolvedValue({
      id: 'tx-1',
      productId: 'product-1',
      amountInCents: 1000,
      currency: 'COP',
      status: TransactionStatus.PENDING,
      wompiTransactionId: 'wompi-1',
      reference: 'REF-1',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      deliveryAddress: 'Street 123',
      deliveryCity: 'Bogota',
      customerPhone: '3001234567',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    paymentGateway.getTransactionStatus.mockRejectedValue(new Error('timeout'));

    const result = await service.execute('tx-1');

    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.status).toBe(TransactionStatus.PENDING);
    }
  });

  it('should update status and decrement stock when pending transaction becomes approved', async () => {
    transactionRepository.findById.mockResolvedValue({
      id: 'tx-1',
      productId: 'product-1',
      amountInCents: 1000,
      currency: 'COP',
      status: TransactionStatus.PENDING,
      wompiTransactionId: 'wompi-1',
      reference: 'REF-1',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      deliveryAddress: 'Street 123',
      deliveryCity: 'Bogota',
      customerPhone: '3001234567',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    paymentGateway.getTransactionStatus.mockResolvedValue('APPROVED');
    transactionRepository.updateStatusFromPending.mockResolvedValue({
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
    });

    const result = await service.execute('tx-1');

    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.status).toBe(TransactionStatus.APPROVED);
    }
    expect(transactionRepository.updateStatusFromPending).toHaveBeenCalledWith(
      'tx-1',
      TransactionStatus.APPROVED,
    );
    expect(productRepository.decrementStock).toHaveBeenCalledWith('product-1', 1);
  });

  it('should not decrement stock when status transition was already handled by another request', async () => {
    transactionRepository.findById
      .mockResolvedValueOnce({
        id: 'tx-1',
        productId: 'product-1',
        amountInCents: 1000,
        currency: 'COP',
        status: TransactionStatus.PENDING,
        wompiTransactionId: 'wompi-1',
        reference: 'REF-1',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        deliveryAddress: 'Street 123',
        deliveryCity: 'Bogota',
        customerPhone: '3001234567',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
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
      });
    paymentGateway.getTransactionStatus.mockResolvedValue('APPROVED');
    transactionRepository.updateStatusFromPending.mockResolvedValue(null);

    const result = await service.execute('tx-1');

    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.status).toBe(TransactionStatus.APPROVED);
    }
    expect(productRepository.decrementStock).not.toHaveBeenCalled();
  });

  it('should return non-pending transaction without calling Wompi', async () => {
    transactionRepository.findById.mockResolvedValue({
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
    });

    const result = await service.execute('tx-1');

    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.status).toBe(TransactionStatus.APPROVED);
    }
    expect(paymentGateway.getTransactionStatus).not.toHaveBeenCalled();
  });

  it('should return pending transaction as-is when wompiTransactionId is null', async () => {
    transactionRepository.findById.mockResolvedValue({
      id: 'tx-1',
      productId: 'product-1',
      amountInCents: 1000,
      currency: 'COP',
      status: TransactionStatus.PENDING,
      wompiTransactionId: null,
      reference: 'REF-1',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      deliveryAddress: 'Street 123',
      deliveryCity: 'Bogota',
      customerPhone: '3001234567',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.execute('tx-1');

    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.status).toBe(TransactionStatus.PENDING);
    }
    expect(paymentGateway.getTransactionStatus).not.toHaveBeenCalled();
  });

  it('should not decrement stock when pending transitions to DECLINED', async () => {
    transactionRepository.findById.mockResolvedValue({
      id: 'tx-1',
      productId: 'product-1',
      amountInCents: 1000,
      currency: 'COP',
      status: TransactionStatus.PENDING,
      wompiTransactionId: 'wompi-1',
      reference: 'REF-1',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      deliveryAddress: 'Street 123',
      deliveryCity: 'Bogota',
      customerPhone: '3001234567',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    paymentGateway.getTransactionStatus.mockResolvedValue('DECLINED');
    transactionRepository.updateStatusFromPending.mockResolvedValue({
      id: 'tx-1',
      productId: 'product-1',
      amountInCents: 1000,
      currency: 'COP',
      status: TransactionStatus.DECLINED,
      wompiTransactionId: 'wompi-1',
      reference: 'REF-1',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      deliveryAddress: 'Street 123',
      deliveryCity: 'Bogota',
      customerPhone: '3001234567',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.execute('tx-1');

    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.status).toBe(TransactionStatus.DECLINED);
    }
    expect(productRepository.decrementStock).not.toHaveBeenCalled();
  });

  it('should return TRANSACTION_PERSISTENCE_ERROR when updateStatusFromPending throws', async () => {
    transactionRepository.findById.mockResolvedValue({
      id: 'tx-1',
      productId: 'product-1',
      amountInCents: 1000,
      currency: 'COP',
      status: TransactionStatus.PENDING,
      wompiTransactionId: 'wompi-1',
      reference: 'REF-1',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      deliveryAddress: 'Street 123',
      deliveryCity: 'Bogota',
      customerPhone: '3001234567',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    paymentGateway.getTransactionStatus.mockResolvedValue('APPROVED');
    transactionRepository.updateStatusFromPending.mockRejectedValue(
      new Error('db error'),
    );

    const result = await service.execute('tx-1');

    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.code).toBe('TRANSACTION_PERSISTENCE_ERROR');
    }
  });

  it('should return STOCK_UPDATE_FAILED when stock decrement throws', async () => {
    transactionRepository.findById.mockResolvedValue({
      id: 'tx-1',
      productId: 'product-1',
      amountInCents: 1000,
      currency: 'COP',
      status: TransactionStatus.PENDING,
      wompiTransactionId: 'wompi-1',
      reference: 'REF-1',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      deliveryAddress: 'Street 123',
      deliveryCity: 'Bogota',
      customerPhone: '3001234567',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    paymentGateway.getTransactionStatus.mockResolvedValue('APPROVED');
    transactionRepository.updateStatusFromPending.mockResolvedValue({
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
    });
    productRepository.decrementStock.mockRejectedValue(
      new Error('stock error'),
    );

    const result = await service.execute('tx-1');

    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.code).toBe('STOCK_UPDATE_FAILED');
    }
  });
});
