import Knex from 'knex'
import { Either, right, left } from 'fp-ts/lib/Either'
import MerchantRepository from '../merchantRepository'
import { LatLong, PlaceDetail, MerchantDetailResponse } from '../../models'

export default class MerchantPostgresRepository implements MerchantRepository {
  private readonly tableName: string

  constructor(private knex: Knex<any, unknown[]>, table: string) {
    this.tableName = table
  }

  getLatLong = async (merchantId: string): Promise<Either<string, LatLong>> => {
    const query = await this.knex(this.tableName)
      .select<LatLong>('name', 'latitude', 'longitude')
      .where({ merchantId })
      .first()

    return query ? right(query) : left(`no info found for merchant with ${merchantId}`)
  }

  updateMerchant = async (
    merchantId: string,
    placeDetail: PlaceDetail
  ): Promise<Either<string, MerchantDetailResponse>> => {
    const update = await this.knex(this.tableName)
      .returning('merchant_id')
      .update<string[]>({
        placeDetail: JSON.stringify(placeDetail)
      })
      .where({ merchantId })

    return update.length > 0
      ? right({ merchantId: update[0], placeDetail })
      : left(`merchantId ${merchantId} not found`)
  }
}
