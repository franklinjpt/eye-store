import { Repository } from 'typeorm';
import { TransactionRepository } from '../../adapters/outbound/persistence/transaction.repository';
import { TransactionOrmEntity } from '../../adapters/outbound/persistence/entities/transaction.orm-entity';
import { TransactionStatus } from '../../domain/models/transaction-status.enum';

type UpdateQueryBuilderMock = {
  update: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  execute: jest.Mock;
};

const buildEntity = (): TransactionOrmEntity => ({
  id: 'tx-1',
  productId: 'product-1',
  amountInCents: '1000',
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

describe('TransactionRepository', () => {
  let repository: TransactionRepository;
  let ormRepository: jest.Mocked<Partial<Repository<TransactionOrmEntity>>>;
  let queryBuilder: UpdateQueryBuilderMock;

  beforeEach(() => {
    queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    ormRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOneOrFail: jest.fn(),
    };

    repository = new TransactionRepository(
      ormRepository as Repository<TransactionOrmEntity>,
    );
  });

  it('should transition status only from pending and return updated transaction', async () => {
    queryBuilder.execute.mockResolvedValue({ affected: 1 });
    ormRepository.findOneOrFail?.mockResolvedValue(buildEntity());

    const result = await repository.updateStatusFromPending(
      'tx-1',
      TransactionStatus.APPROVED,
      'wompi-1',
    );

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'id = :id AND status = :pendingStatus',
      {
        id: 'tx-1',
        pendingStatus: TransactionStatus.PENDING,
      },
    );
    expect(result?.status).toBe(TransactionStatus.APPROVED);
    expect(result?.amountInCents).toBe(1000);
  });

  it('should return null when transaction is no longer pending', async () => {
    queryBuilder.execute.mockResolvedValue({ affected: 0 });

    const result = await repository.updateStatusFromPending(
      'tx-1',
      TransactionStatus.APPROVED,
      'wompi-1',
    );

    expect(result).toBeNull();
    expect(ormRepository.findOneOrFail).not.toHaveBeenCalled();
  });
});
