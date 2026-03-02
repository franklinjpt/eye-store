import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../../../domain/models/transaction';
import { TransactionStatus } from '../../../domain/models/transaction-status.enum';
import { TransactionRepositoryPort } from '../../../domain/ports/outbound/transaction-repository.port';
import { TransactionOrmEntity } from './entities/transaction.orm-entity';
import { TransactionPersistenceMapper } from './mappers/transaction-persistence.mapper';

@Injectable()
export class TransactionRepository implements TransactionRepositoryPort {
  constructor(
    @InjectRepository(TransactionOrmEntity)
    private readonly ormRepository: Repository<TransactionOrmEntity>,
  ) {}

  async save(
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Transaction> {
    const partial = TransactionPersistenceMapper.toEntity(transaction);
    const entity = this.ormRepository.create(partial);
    const saved = await this.ormRepository.save(entity);
    return TransactionPersistenceMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Transaction | null> {
    const entity = await this.ormRepository.findOne({ where: { id } });
    return entity ? TransactionPersistenceMapper.toDomain(entity) : null;
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
    wompiTransactionId?: string,
  ): Promise<Transaction> {
    const updateData: Partial<TransactionOrmEntity> = { status };
    if (wompiTransactionId) {
      updateData.wompiTransactionId = wompiTransactionId;
    }
    await this.ormRepository.update(id, updateData);
    const updated = await this.ormRepository.findOneOrFail({ where: { id } });
    return TransactionPersistenceMapper.toDomain(updated);
  }
}
