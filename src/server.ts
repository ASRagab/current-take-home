import express from 'express'
import { Client } from '@googlemaps/google-maps-services-js'
import TransactionPostgresRepository from './repositories/postgres/transactionPostgresRepository'
import UserPostgresRepository from './repositories/postgres/userPostgresRepository'
import UserAuthPostgresRepository from './repositories/postgres/userAuthPostgresRepository'
import db from './db'
import { Tables, Dependencies } from './environment'
import App from './app'
import UserController from './controllers/userController'
import MerchantPostgresRepository from './repositories/postgres/merchantPostgresRepository'
import MerchantController from './controllers/merchantController'

const environment = {
  port: parseInt(process.env.PORT || '8080', 10),
  apiKey: process.env.MAPS_API_KEY || ''
}

const dbConfig = {
  user: process.env.DB_USER || 'current',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'current',
  host: process.env.DB_INSTANCE || '127.0.0.1'
}

const knex = db(dbConfig)
const places = new Client({})

const transactions = new TransactionPostgresRepository(knex, Tables.transaction)
const users = new UserPostgresRepository(knex, Tables.user)
const auth = new UserAuthPostgresRepository(knex, Tables.userRoles)
const merchants = new MerchantPostgresRepository(knex, Tables.merchant)

const dependencies: Dependencies = {
  places,
  balanceCache: transactions.balanceCache,
  repositories: {
    transactions,
    users,
    auth,
    merchants
  }
}

const controllers = [
  new UserController(dependencies),
  new MerchantController(dependencies, environment.apiKey)
]

const app = new App(express(), environment, dependencies, controllers)

app.listen()
