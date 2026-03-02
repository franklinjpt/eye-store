import { TransactionStatus } from '../models/transaction-status.enum';

const WOMPI_STATUS_MAP: Record<string, TransactionStatus> = {
  APPROVED: TransactionStatus.APPROVED,
  DECLINED: TransactionStatus.DECLINED,
  VOIDED: TransactionStatus.VOIDED,
  ERROR: TransactionStatus.ERROR,
  PENDING: TransactionStatus.PENDING,
};

export class WompiStatusMapper {
  static toDomain(wompiStatus: string): TransactionStatus {
    const normalizedStatus = wompiStatus.trim().toUpperCase();
    return WOMPI_STATUS_MAP[normalizedStatus] ?? TransactionStatus.ERROR;
  }
}
