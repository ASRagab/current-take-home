import { Client } from '@googlemaps/google-maps-services-js'
import TransactionRepository from './repositories/transactionRepository'
import UserRepository from './repositories/userRepository'
import UserAuthRepository from './repositories/userAuthRepository'
import { BalanceCache } from './models'
import MerchantRepository from './repositories/merchantRepository'

export interface Environment {
  port: number
  apiKey: string
}

export interface DbConfiguration {
  user: string
  password: string
  database: string
  host: string
}

export interface Configuration {
  dbConfig: DbConfiguration
}

export interface Dependencies {
  places: Client
  balanceCache: Promise<BalanceCache>
  repositories: {
    transactions: TransactionRepository
    users: UserRepository
    auth: UserAuthRepository
    merchants: MerchantRepository
  }
}

export const enum Tables {
  transaction = 'transactions',
  user = 'users',
  merchant = 'merchants'
}
