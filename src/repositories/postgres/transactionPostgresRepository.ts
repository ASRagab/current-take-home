import Knex from 'knex'
import { Either, right, left } from 'fp-ts/lib/Either'
import TransactionRepository from '../transactionRepository'
import {
  DbTransaction,
  TransactionCode,
  MerchantSummary,
  BalanceCache,
  TransactionAuthorizationRequest
} from '../../models'
import { Tables } from '../../environment'

export default class TransactionPostgresRepository implements TransactionRepository {
  private readonly tableName: string

  balanceCache: Promise<BalanceCache> // this is cheating a bit, but I think a real version could be built using some Redis like infra

  constructor(private knex: Knex<any, unknown[]>, table: string) {
    this.tableName = table

    this.balanceCache = this.hydrateCache()
  }

  /**
   * This loads the cache of user balances in memory, it _should_ be hydrated on repo instantiation
   */
  private hydrateCache = async (): Promise<BalanceCache> => {
    const res = await this.knex(this.tableName)
      .select('user_id')
      .groupBy('user_id')
      .sum('amount_in_cents')

    return res.reduce((acc, current) => {
      acc[current.userId] = parseInt(current.sum, 10)
      return acc
    }, {})
  }

  /**
   * authorize uses the cache hydrated on app start, *NOTE* transaction is not saved
   * @param userId the database id of user
   * @param transaction the authorization request
   */
  authorize = async (
    userId: string,
    transaction: TransactionAuthorizationRequest
  ): Promise<Either<string, TransactionCode>> => {
    const cache = await this.balanceCache
    const hit = cache[userId]

    if (hit) {
      return hit - transaction.amountInCents > 0
        ? right(TransactionCode.approved)
        : right(TransactionCode.declined)
    }

    return left(`userId: ${userId} not found or has no transactions`)
  }

  getByMerchant = async (
    userId: string,
    merchantId: string
  ): Promise<Either<string, DbTransaction[]>> => {
    try {
      const query = await this.knex(this.tableName)
        .select<DbTransaction[]>('*') // I know this is wrong, and I should feel bad
        .where({ userId, merchantId })

      return right(query) // maybe not a big deal if no transactions are found
    } catch (e) {
      console.error(e)
      return left(`getByMerchant query failed`)
    }
  }

  getByTime = async (
    userId: string,
    start: string,
    end: string
  ): Promise<Either<string, DbTransaction[]>> => {
    try {
      const query = await this.knex(this.tableName)
        .where({ userId })
        .andWhereBetween('timestamp', [start, end]) // validation happens upstream, formatted as yyyy-MM-dd
        .select<DbTransaction[]>('*') // I know this is wrong, and I should feel bad

      return right(query) // maybe not a big deal if no transactions are found
    } catch (e) {
      console.error(e)
      return left(`getByTime query failed`)
    }
  }

  /**
   * This will compute from the database the amount "spent" at each merchant. As debits are negative and credits
   * are positive, we have inverted the calculation here to render amounts from the merchant's perspective. **NOTE**
   * the "Bank" merchant will appear as negative for bank accounts with positive balance
   * @param userId the dabase user id
   */
  summarize = async (userId: string): Promise<Either<string, MerchantSummary>> => {
    try {
      const merchantName = `${Tables.merchant}.name`
      const merchantId = `${Tables.merchant}.merchant_id`

      const query = await this.knex(this.tableName)
        .innerJoin(Tables.merchant, `${this.tableName}.merchant_id`, merchantId)
        .sum('amount_in_cents')
        .select(merchantName)
        .where({ userId })
        .groupBy(merchantName)

      return query.length > 0
        ? right(
            query.reduce((acc, current) => {
              acc[current.name] = parseInt(current.sum, 10) * -1
              return acc
            }, {})
          )
        : right({})
    } catch (e) {
      console.error(e)
      return left(`summarize query failed`)
    }
  }
}
