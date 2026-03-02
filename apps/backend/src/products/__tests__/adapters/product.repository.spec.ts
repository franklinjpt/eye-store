import { Repository } from 'typeorm';
import { ProductRepository } from '../../adapters/outbound/persistence/product.repository';
import { ProductOrmEntity } from '../../adapters/outbound/persistence/entities/product.orm-entity';

type UpdateQueryBuilderMock = {
  update: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  setParameter: jest.Mock;
  execute: jest.Mock;
};

describe('ProductRepository', () => {
  let repository: ProductRepository;
  let ormRepository: jest.Mocked<Partial<Repository<ProductOrmEntity>>>;
  let queryBuilder: UpdateQueryBuilderMock;

  beforeEach(() => {
    queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    ormRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    repository = new ProductRepository(ormRepository as Repository<ProductOrmEntity>);
  });

  it('should use parameterized query when decrementing stock', async () => {
    queryBuilder.execute.mockResolvedValue({ affected: 1 });

    await repository.decrementStock('product-1', 2);

    expect(queryBuilder.set).toHaveBeenCalledWith({ stock: expect.any(Function) });
    expect(
      (queryBuilder.set.mock.calls[0][0].stock as () => string)(),
    ).toBe('stock - :qty');
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'id = :id AND stock >= :qty',
      { id: 'product-1' },
    );
    expect(queryBuilder.setParameter).toHaveBeenCalledWith('qty', 2);
  });

  it('should throw when product does not have enough stock', async () => {
    queryBuilder.execute.mockResolvedValue({ affected: 0 });

    await expect(repository.decrementStock('product-1', 2)).rejects.toThrow(
      'Insufficient stock or product not found',
    );
  });
});
