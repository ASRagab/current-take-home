import { Either } from 'fp-ts/lib/Either'
import {
  TransactionCode,
  MerchantSummary,
  DbTransaction,
  BalanceCache,
  TransactionAuthorizationRequest
} from '../models'

export default interface TransactionRepository {
  balanceCache: Promise<BalanceCache>

  authorize(
    userId: string,
    transaction: TransactionAuthorizationRequest
  ): Promise<Either<string, TransactionCode>>

  getByMerchant(userId: string, merchantId: string): Promise<Either<string, DbTransaction[]>>
  getByTime(userId: string, start: string, end: string): Promise<Either<string, DbTransaction[]>>
  summarize(userId: string): Promise<Either<string, MerchantSummary>>
}
