/* eslint-disable prefer-promise-reject-errors */
import request from 'supertest'
import express from 'express'
import { right, left } from 'fp-ts/lib/Either'
import { Dependencies } from '../../environment'
import UserController from '../userController'
import { globalErrorHandler } from '../../middleware'
import UserRepository from '../../repositories/userRepository'
import UserAuthRepository from '../../repositories/userAuthRepository'
import TransactionRepository from '../../repositories/transactionRepository'
import MerchantRepository from '../../repositories/merchantRepository'
import { DbTransaction, MerchantSummary, TransactionCode } from '../../models'

describe('UserController', () => {
  const userId = 'ad07da7c-ad89-46eb-9a74-55b99e834e49'

  const app = express().use(express.json())

  const mockDependencies = jest.genMockFromModule<Dependencies>('../../environment')
  mockDependencies.balanceCache = Promise.resolve({ [userId]: 34343343 })
  mockDependencies.repositories = {
    users: jest.genMockFromModule<UserRepository>('../../repositories/userRepository'),
    auth: jest.genMockFromModule<UserAuthRepository>('../../repositories/userAuthRepository'),
    transactions: jest.genMockFromModule<TransactionRepository>(
      '../../repositories/transactionRepository'
    ),
    merchants: jest.genMockFromModule<MerchantRepository>('../../repositories/merchantRepository')
  }

  const controller = new UserController(mockDependencies)

  beforeEach(() => {
    app.use(controller.router).use(globalErrorHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe(`GET /users/:userId/balance`, () => {
    it('should return 200 with a balance if user found', done => {
      const getBalanceRoute = `/users/${userId}/balance`
      request(app)
        .get(getBalanceRoute)
        .expect(200, { code: 0, message: 34343343 })
        .end(done)
    })

    it('should return 400 with a balance if user not found', done => {
      const getBalanceRoute = `/users/bad/balance`
      request(app)
        .get(getBalanceRoute)
        .expect(400)
        .end(done)
    })
  })

  describe(`GET /users/:userId/transactions/merchant/:merchantId`, () => {
    const getByMerchant = '/users/:userId/transactions/merchant/:merchantId'

    it('should return 200 if query returns right', done => {
      mockDependencies.repositories.transactions.getByMerchant = jest.fn(_ =>
        Promise.resolve(right<string, DbTransaction[]>([]))
      )
      request(app)
        .get(getByMerchant)
        .expect(200, { code: 0, message: [] })
        .end(done)
    })

    it('should return 400 if query returns left', done => {
      mockDependencies.repositories.transactions.getByMerchant = jest.fn(_ =>
        Promise.resolve(left(`:shrug:`))
      )
      request(app)
        .get(getByMerchant)
        .expect(400, { code: 110, message: `:shrug:` })
        .end(done)
    })

    it('should return 500 if something unexpected happens', done => {
      mockDependencies.repositories.transactions.getByMerchant = jest.fn(_ => {
        throw new Error('sad')
      })

      request(app)
        .get(getByMerchant)
        .expect(500, { code: -99, message: `sad` }) // global error handler
        .end(done)
    })

    it('should return 500 if query fails', done => {
      mockDependencies.repositories.transactions.getByMerchant = jest.fn(_ => Promise.reject(`sad`))

      request(app)
        .get(getByMerchant)
        .expect(500, { code: -1, message: `sad` }) // global error handler
        .end(done)
    })
  })

  describe(`GET /users/:userId/transactions`, () => {
    it('should return 200 if query is successful and params are valid', done => {
      const getTransactions = `/users/:userId/transactions?start=2019-01-01&end=2020-01-01`
      mockDependencies.repositories.transactions.getByTime = jest.fn(_ =>
        Promise.resolve(right<string, DbTransaction[]>([]))
      )

      request(app)
        .get(getTransactions)
        .expect(200, { code: 0, message: [] })
        .end(done)
    })

    it('should return 400 if query if param is missing', done => {
      const getTransactions = `/users/:userId/transactions?start=2019-01-01`
      request(app)
        .get(getTransactions)
        .expect(400, { code: 107, message: `missing start or end` })
        .end(done)
    })

    it('should return 400 if start is after end', done => {
      const getTransactions = `/users/:userId/transactions?start=2029-01-01&end=2020-01-01`

      request(app)
        .get(getTransactions)
        .expect(400, { code: 108, message: `provided start is after provided end date` })
        .end(done)
    })

    it('should return 200 if query returns no results', done => {
      const getTransactions = `/users/:userId/transactions?start=2019-01-01&end=2020-01-01`
      mockDependencies.repositories.transactions.getByTime = jest.fn(_ =>
        Promise.resolve(right<string, DbTransaction[]>([]))
      )

      request(app)
        .get(getTransactions)
        .expect(200, { code: 0, message: [] })
        .end(done)
    })

    it('should return 500 if query fails', done => {
      const getTransactions = `/users/:userId/transactions?start=2019-01-01&end=2020-01-01`
      mockDependencies.repositories.transactions.getByTime = jest.fn(_ => Promise.reject(`bad`))

      request(app)
        .get(getTransactions)
        .expect(500, { code: -1, message: `bad` })
        .end(done)
    })
  })

  describe(`GET /users/:userId/transactions/summarize`, () => {
    const getSummary = `/users/:userId/transactions/summarize`

    it('should return 200 if query is successful', done => {
      mockDependencies.repositories.transactions.summarize = jest.fn(_ =>
        Promise.resolve(right<string, MerchantSummary>({}))
      )

      request(app)
        .get(getSummary)
        .expect(200, { code: 0, message: {} })
        .end(done)
    })

    it('should return 500 if query fails', done => {
      mockDependencies.repositories.transactions.summarize = jest.fn(_ => Promise.reject(`bad`))

      request(app)
        .get(getSummary)
        .expect(500, { code: -1, message: `bad` })
        .end(done)
    })
  })

  describe(`POST /users`, () => {
    const createUser = `/users`
    const body = { email: 'email', firstName: 'first', lastName: 'last', password: 'shhh....' }

    it('should return 201 if create is successful', done => {
      mockDependencies.repositories.users.create = jest.fn(_ =>
        Promise.resolve(right<string, string>(userId))
      )

      request(app)
        .post(createUser)
        .send(body)
        .expect(201, { code: 0, message: userId })
        .end(done)
    })

    it('should return 400 if request body missing', done => {
      mockDependencies.repositories.users.create = jest.fn(_ => Promise.reject(`bad`))

      request(app)
        .post(createUser)
        .expect(400, { code: 100, message: 'expected CreateUserRequest received {}' })
        .end(done)
    })

    it('should return 400 if request body incomplete', done => {
      mockDependencies.repositories.users.create = jest.fn(_ => Promise.reject(`bad`))

      const incomplete = {
        email: 'email',
        firstName: 'first',
        password: 'shhh....'
      }

      request(app)
        .post(createUser)
        .send(incomplete)
        .expect(400, {
          code: 100,
          message: `expected CreateUserRequest received ${JSON.stringify(incomplete)}`
        })
        .end(done)
    })

    it('should return 500 if query fails', done => {
      mockDependencies.repositories.users.create = jest.fn(_ => Promise.reject(`bad`))

      request(app)
        .post(createUser)
        .send(body)
        .expect(500, { code: -1, message: `bad` })
        .end(done)
    })
  })

  describe(`POST /users/:userId/transactions/authorize`, () => {
    const authorizeTransactions = `/users/:userId/transactions/authorize`
    const body = { amountInCents: 23423 }

    it('should return 200 and approval code if authorize is successful', done => {
      mockDependencies.repositories.transactions.authorize = jest.fn(_ =>
        Promise.resolve(right<string, TransactionCode>(TransactionCode.approved))
      )

      request(app)
        .post(authorizeTransactions)
        .send(body)
        .expect(200, { code: 0, message: 'approved' })
        .end(done)
    })

    it('should return 200 and declined code if transaction is declined', done => {
      mockDependencies.repositories.transactions.authorize = jest.fn(_ =>
        Promise.resolve(right<string, TransactionCode>(TransactionCode.declined))
      )

      request(app)
        .post(authorizeTransactions)
        .send(body)
        .expect(200, { code: 0, message: 'declined' })
        .end(done)
    })

    it('should return 400 if request body incomplete', done => {
      const incomplete = {}

      request(app)
        .post(authorizeTransactions)
        .send(incomplete)
        .expect(400, {
          code: 100,
          message: `expected TransactionAuthorizationRequest received ${JSON.stringify(incomplete)}`
        })
        .end(done)
    })

    it('should return 500 if query fails', done => {
      mockDependencies.repositories.transactions.authorize = jest.fn(_ =>
        Promise.reject(`something went wrong...`)
      )

      request(app)
        .post(authorizeTransactions)
        .send(body)
        .expect(500, { code: -1, message: `something went wrong...` })
        .end(done)
    })
  })

  describe('PUT /users/:userId/update/email', () => {
    const updateEmail = `/users/${userId}/update/email`

    it('should return 200 and the userId updated if it updates an email', done => {
      mockDependencies.repositories.users.updateEmail = jest.fn(_ => Promise.resolve(right(userId)))

      const body = { email: 'email' }

      request(app)
        .put(updateEmail)
        .send(body)
        .expect(200, { code: 0, message: userId })
        .end(done)
    })

    it('should return 400 if no email address provided', done => {
      const body = {}

      request(app)
        .put(updateEmail)
        .send(body)
        .expect(400, { code: 104, message: `no email address provided` })
        .end(done)
    })

    it('should return 400 if email invalid', done => {
      mockDependencies.repositories.users.updateEmail = jest.fn(_ =>
        Promise.resolve(left(`email is not valid`))
      )

      const body = { email: `email` }

      request(app)
        .put(updateEmail)
        .send(body)
        .expect(400, { code: 104, message: `email is not valid` })
        .end(done)
    })

    it('should return 500 if update fails', done => {
      mockDependencies.repositories.users.updateEmail = jest.fn(_ =>
        Promise.reject(`something bad happened...`)
      )

      const body = { email: `email` }

      request(app)
        .put(updateEmail)
        .send(body)
        .expect(500, { code: -1, message: `something bad happened...` })
        .end(done)
    })
  })

  describe('PUT /users/:userId/update/name', () => {
    const updateName = `/users/${userId}/update/name`

    it('should return 200 and the userId updated if it updates a name', done => {
      mockDependencies.repositories.users.updateName = jest.fn(_ => Promise.resolve(right(userId)))

      const body = { firstName: 'name' }

      request(app)
        .put(updateName)
        .send(body)
        .expect(200, { code: 0, message: userId })
        .end(done)
    })

    it('should return 400 if no names provided', done => {
      const body = {}

      request(app)
        .put(updateName)
        .send(body)
        .expect(400, { code: 103, message: `one of the firstName or lastName should be provided` })
        .end(done)
    })

    it('should return 500 if update fails', done => {
      mockDependencies.repositories.users.updateName = jest.fn(_ =>
        Promise.reject(`something bad happened...`)
      )

      const body = { lastName: `name` }

      request(app)
        .put(updateName)
        .send(body)
        .expect(500, { code: -1, message: `something bad happened...` })
        .end(done)
    })
  })

  describe('PUT /users/:userId/update/password', () => {
    const updatePassword = `/users/${userId}/update/password`

    it('should return 200 and the userId updated if it updates a password', done => {
      mockDependencies.repositories.users.updatePassword = jest.fn(_ =>
        Promise.resolve(right(userId))
      )

      const body = { password: 'shh...' }

      request(app)
        .put(updatePassword)
        .send(body)
        .expect(200, { code: 0, message: userId })
        .end(done)
    })

    it('should return 400 if no password provided', done => {
      const body = {}

      request(app)
        .put(updatePassword)
        .send(body)
        .expect(400, { code: 105, message: `No password provided` })
        .end(done)
    })

    it('should return 500 if update fails', done => {
      mockDependencies.repositories.users.updatePassword = jest.fn(_ =>
        Promise.reject(`something bad happened...`)
      )

      const body = { password: `shh...` }

      request(app)
        .put(updatePassword)
        .send(body)
        .expect(500, { code: -1, message: `something bad happened...` })
        .end(done)
    })
  })
})
