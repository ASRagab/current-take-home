export interface DbUser {
  userId: string
  firstName: string
  lastName: string
  email: string
  password: string
}

export type User = Pick<DbUser, 'userId' | 'email' | 'firstName' | 'lastName'>
export type CreateUserRequest = Pick<DbUser, 'email' | 'firstName' | 'lastName' | 'password'>
export type UpdateUserRequest = Partial<DbUser>

export interface DbMerchant {
  merchantId: string
  name: string
  latitude: number | undefined
  longitude: number | undefined
  address: string | undefined
}

export type Merchant = NonNullable<DbMerchant>

export interface DbTransaction {
  transactionId: string
  userId: string
  merchantId: string
  amountInCents: number
  timestamp: string
}

export interface Transaction {
  merchant: string
  latitude: number | undefined
  longitude: number | undefined
  amountInCents: number
  timestamp: string
}

export interface TransactionAuthorizationRequest {
  amountInCents: number
}

export interface ByTimePeriod {
  start: string
  end: string
}

export interface ByMerchant {
  merchantId: string
}

export type BalanceCache = { [key: string]: number }

export type MerchantSummary = { [key: string]: number }

export const enum TransactionCode {
  declined = 'declined',
  approved = 'approved'
}

export interface LatLong {
  name: string
  latitude: number
  longitude: number
}

export interface PlaceDetail {
  name?: string
  formattedAdress?: string
  placeId?: string
}

export interface MerchantDetailResponse {
  merchantId: string
  placeDetail: PlaceDetail
}
