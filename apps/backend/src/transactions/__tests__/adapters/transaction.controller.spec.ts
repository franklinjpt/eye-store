import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ok, err } from '../../../common/result';
import { TransactionStatus } from '../../domain/models/transaction-status.enum';
import { CreateTransactionViewUseCase } from '../../domain/ports/inbound/create-transaction-view.use-case';
import { GetTransactionViewUseCase } from '../../domain/ports/inbound/get-transaction-view.use-case';
import { TransactionController } from '../../adapters/inbound/http/transaction.controller';
import {
  CREATE_TRANSACTION_VIEW_USE_CASE,
  GET_TRANSACTION_VIEW_USE_CASE,
} from '../../transactions.tokens';

describe('TransactionController', () => {
  let controller: TransactionController;
  let createTransactionViewUseCase: jest.Mocked<CreateTransactionViewUseCase>;
  let getTransactionViewUseCase: jest.Mocked<GetTransactionViewUseCase>;

  beforeEach(async () => {
    const mockCreateTransactionViewUseCase: jest.Mocked<CreateTransactionViewUseCase> =
      {
        execute: jest.fn(),
      };
    const mockGetTransactionViewUseCase: jest.Mocked<GetTransactionViewUseCase> =
      {
        execute: jest.fn(),
      };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: CREATE_TRANSACTION_VIEW_USE_CASE,
          useValue: mockCreateTransactionViewUseCase,
        },
        {
          provide: GET_TRANSACTION_VIEW_USE_CASE,
          useValue: mockGetTransactionViewUseCase,
        },
      ],
    }).compile();

    controller = module.get(TransactionController);
    createTransactionViewUseCase = module.get(CREATE_TRANSACTION_VIEW_USE_CASE);
    getTransactionViewUseCase = module.get(GET_TRANSACTION_VIEW_USE_CASE);
  });

  it('should create transaction and return response dto', async () => {
    createTransactionViewUseCase.execute.mockResolvedValue(
      ok({
        id: 'tx-1',
        status: TransactionStatus.PENDING,
        reference: 'REF-1',
        amountInCents: 1000,
        productName: 'Blue Frame',
      }),
    );

    const result = await controller.create({
      productId: 'product-1',
      tokenId: 'tok',
      acceptanceToken: 'accept',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      deliveryAddress: 'Street 123',
      deliveryCity: 'Bogota',
      customerPhone: '3001234567',
    });

    expect(result.id).toBe('tx-1');
    expect(result.productName).toBe('Blue Frame');
  });

  it('should map create failure to 404 for PRODUCT_NOT_FOUND', async () => {
    createTransactionViewUseCase.execute.mockResolvedValue(
      err({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product with id "product-1" not found',
      }),
    );

    try {
      await controller.create({
        productId: 'product-1',
        tokenId: 'tok',
        acceptanceToken: 'accept',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        deliveryAddress: 'Street 123',
        deliveryCity: 'Bogota',
        customerPhone: '3001234567',
      });
      fail('Expected controller to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(404);
    }
  });

  it('should map get failure to 404 for TRANSACTION_NOT_FOUND', async () => {
    getTransactionViewUseCase.execute.mockResolvedValue(
      err({
        code: 'TRANSACTION_NOT_FOUND',
        message: 'Transaction with id "tx-1" not found',
      }),
    );

    try {
      await controller.findOne('tx-1');
      fail('Expected controller to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(404);
    }
  });
});
