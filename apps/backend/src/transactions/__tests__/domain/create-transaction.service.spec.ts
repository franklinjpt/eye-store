import { Test, TestingModule } from '@nestjs/testing';
import { CHECKOUT_FEES_CENTS } from '@eye-store/shared';
import { ProductType } from '../../../products/domain/models/product-type.enum';
import { ProductRepositoryPort } from '../../../products/domain/ports/outbound/product-repository.port';
import { PRODUCT_REPOSITORY_PORT } from '../../../products/products.tokens';
import { TransactionStatus } from '../../domain/models/transaction-status.enum';
import { CreateTransactionCommand } from '../../domain/ports/inbound/create-transaction.use-case';
import { PaymentGatewayPort } from '../../domain/ports/outbound/payment-gateway.port';
import { TransactionRepositoryPort } from '../../domain/ports/outbound/transaction-repository.port';
import { CreateTransactionService } from '../../domain/services/create-transaction.service';
import {
  PAYMENT_GATEWAY_PORT,
  TRANSACTION_REPOSITORY_PORT,
} from '../../transactions.tokens';

const command: CreateTransactionCommand = {
  productId: 'product-1',
  tokenId: 'tok_test',
  acceptanceToken: 'acceptance_test',
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  deliveryAddress: 'Street 123',
  deliveryCity: 'Bogota',
  customerPhone: '3001234567',
};

const expectedTransactionAmountCents =
  Math.round(100000) * 100 +
  CHECKOUT_FEES_CENTS.base +
  CHECKOUT_FEES_CENTS.delivery;

describe('CreateTransactionService', () => {
  let service: CreateTransactionService;
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
        CreateTransactionService,
        {
          provide: TRANSACTION_REPOSITORY_PORT,
          useValue: mockTransactionRepository,
        },
        { provide: PAYMENT_GATEWAY_PORT, useValue: mockPaymentGateway },
        { provide: PRODUCT_REPOSITORY_PORT, useValue: mockProductRepository },
      ],
    }).compile();

    service = module.get(CreateTransactionService);
    transactionRepository = module.get(TRANSACTION_REPOSITORY_PORT);
    paymentGateway = module.get(PAYMENT_GATEWAY_PORT);
    productRepository = module.get(PRODUCT_REPOSITORY_PORT);
  });

  it('should return PRODUCT_NOT_FOUND when product does not exist', async () => {
    productRepository.findById.mockResolvedValue(null);

    const result = await service.execute(command);

    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.code).toBe('PRODUCT_NOT_FOUND');
    }
  });

  it('should return OUT_OF_STOCK when product stock is zero', async () => {
    productRepository.findById.mockResolvedValue({
      id: command.productId,
      name: 'Test Frame',
      price: 100000,
      description: 'test',
      type: ProductType.FRAME,
      stock: 0,
      position: 1,
      sku: 'SKU-1',
      image: 'https://example.com/image.jpg',
    });

    const result = await service.execute(command);

    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.code).toBe('OUT_OF_STOCK');
    }
  });

  it('should return PAYMENT_GATEWAY_ERROR and mark transaction as ERROR when gateway fails', async () => {
    productRepository.findById.mockResolvedValue({
      id: command.productId,
      name: 'Test Frame',
      price: 100000,
      description: 'test',
      type: ProductType.FRAME,
      stock: 1,
      position: 1,
      sku: 'SKU-1',
      image: 'https://example.com/image.jpg',
    });
    transactionRepository.save.mockResolvedValue({
      id: 'tx-1',
      productId: command.productId,
      amountInCents: expectedTransactionAmountCents,
      currency: 'COP',
      status: TransactionStatus.PENDING,
      wompiTransactionId: null,
      reference: 'REF-1',
      customerName: command.customerName,
      customerEmail: command.customerEmail,
      deliveryAddress: command.deliveryAddress,
      deliveryCity: command.deliveryCity,
      customerPhone: command.customerPhone,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    paymentGateway.createPayment.mockRejectedValue(new Error('wompi down'));
    transactionRepository.updateStatus.mockResolvedValue({
      id: 'tx-1',
      productId: command.productId,
      amountInCents: expectedTransactionAmountCents,
      currency: 'COP',
      status: TransactionStatus.ERROR,
      wompiTransactionId: null,
      reference: 'REF-1',
      customerName: command.customerName,
      customerEmail: command.customerEmail,
      deliveryAddress: command.deliveryAddress,
      deliveryCity: command.deliveryCity,
      customerPhone: command.customerPhone,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.execute(command);

    expect(result.kind).toBe('err');
    if (result.kind === 'err') {
      expect(result.error.code).toBe('PAYMENT_GATEWAY_ERROR');
    }
    expect(transactionRepository.updateStatus).toHaveBeenCalledWith(
      'tx-1',
      TransactionStatus.ERROR,
    );
  });

  it('should return approved transaction and decrement stock when payment is approved', async () => {
    productRepository.findById.mockResolvedValue({
      id: command.productId,
      name: 'Test Frame',
      price: 100000,
      description: 'test',
      type: ProductType.FRAME,
      stock: 1,
      position: 1,
      sku: 'SKU-1',
      image: 'https://example.com/image.jpg',
    });
    transactionRepository.save.mockResolvedValue({
      id: 'tx-1',
      productId: command.productId,
      amountInCents: expectedTransactionAmountCents,
      currency: 'COP',
      status: TransactionStatus.PENDING,
      wompiTransactionId: null,
      reference: 'REF-1',
      customerName: command.customerName,
      customerEmail: command.customerEmail,
      deliveryAddress: command.deliveryAddress,
      deliveryCity: command.deliveryCity,
      customerPhone: command.customerPhone,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    paymentGateway.createPayment.mockResolvedValue({
      transactionId: 'wompi-1',
      status: 'APPROVED',
    });
    transactionRepository.updateStatusFromPending.mockResolvedValue({
      id: 'tx-1',
      productId: command.productId,
      amountInCents: expectedTransactionAmountCents,
      currency: 'COP',
      status: TransactionStatus.APPROVED,
      wompiTransactionId: 'wompi-1',
      reference: 'REF-1',
      customerName: command.customerName,
      customerEmail: command.customerEmail,
      deliveryAddress: command.deliveryAddress,
      deliveryCity: command.deliveryCity,
      customerPhone: command.customerPhone,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.execute(command);

    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.status).toBe(TransactionStatus.APPROVED);
      expect(result.value.wompiTransactionId).toBe('wompi-1');
    }
    expect(transactionRepository.updateStatusFromPending).toHaveBeenCalledWith(
      'tx-1',
      TransactionStatus.APPROVED,
      'wompi-1',
    );
    expect(paymentGateway.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amountInCents: expectedTransactionAmountCents,
      }),
    );
    expect(productRepository.decrementStock).toHaveBeenCalledWith(
      command.productId,
      1,
    );
  });

  it('should not decrement stock when transition from pending is already handled by another request', async () => {
    productRepository.findById.mockResolvedValue({
      id: command.productId,
      name: 'Test Frame',
      price: 100000,
      description: 'test',
      type: ProductType.FRAME,
      stock: 1,
      position: 1,
      sku: 'SKU-1',
      image: 'https://example.com/image.jpg',
    });
    transactionRepository.save.mockResolvedValue({
      id: 'tx-1',
      productId: command.productId,
      amountInCents: expectedTransactionAmountCents,
      currency: 'COP',
      status: TransactionStatus.PENDING,
      wompiTransactionId: null,
      reference: 'REF-1',
      customerName: command.customerName,
      customerEmail: command.customerEmail,
      deliveryAddress: command.deliveryAddress,
      deliveryCity: command.deliveryCity,
      customerPhone: command.customerPhone,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    paymentGateway.createPayment.mockResolvedValue({
      transactionId: 'wompi-1',
      status: 'APPROVED',
    });
    transactionRepository.updateStatusFromPending.mockResolvedValue(null);
    transactionRepository.findById.mockResolvedValue({
      id: 'tx-1',
      productId: command.productId,
      amountInCents: expectedTransactionAmountCents,
      currency: 'COP',
      status: TransactionStatus.APPROVED,
      wompiTransactionId: 'wompi-1',
      reference: 'REF-1',
      customerName: command.customerName,
      customerEmail: command.customerEmail,
      deliveryAddress: command.deliveryAddress,
      deliveryCity: command.deliveryCity,
      customerPhone: command.customerPhone,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.execute(command);

    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.status).toBe(TransactionStatus.APPROVED);
      expect(result.value.wompiTransactionId).toBe('wompi-1');
    }
    expect(productRepository.decrementStock).not.toHaveBeenCalled();
  });
});
