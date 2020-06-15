import { Either } from 'fp-ts/lib/Either'
import { LatLong, PlaceDetail } from '../models'

export default interface MerchantRepository {
  getLatLong(merchantId: string): Promise<Either<string, LatLong>>
  updateMerchant(merchantId: string, placeDetail: PlaceDetail): Promise<Either<string, string>>
}
