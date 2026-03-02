import { TransactionStatus } from '../../domain/models/transaction-status.enum';
import { WompiStatusMapper } from '../../domain/mappers/wompi-status.mapper';

describe('WompiStatusMapper', () => {
  it('should map known wompi statuses to transaction statuses', () => {
    expect(WompiStatusMapper.toDomain('APPROVED')).toBe(
      TransactionStatus.APPROVED,
    );
    expect(WompiStatusMapper.toDomain('DECLINED')).toBe(
      TransactionStatus.DECLINED,
    );
    expect(WompiStatusMapper.toDomain('VOIDED')).toBe(TransactionStatus.VOIDED);
    expect(WompiStatusMapper.toDomain('ERROR')).toBe(TransactionStatus.ERROR);
    expect(WompiStatusMapper.toDomain('PENDING')).toBe(TransactionStatus.PENDING);
  });

  it('should normalize wompi status before mapping', () => {
    expect(WompiStatusMapper.toDomain(' approved ')).toBe(
      TransactionStatus.APPROVED,
    );
  });

  it('should map unknown statuses to ERROR', () => {
    expect(WompiStatusMapper.toDomain('UNKNOWN_STATUS')).toBe(
      TransactionStatus.ERROR,
    );
  });
});
