import { Router, Request, Response } from 'express'
import { isRight } from 'fp-ts/lib/Either'
import { isOfType, validatePeriod } from '../utils'
import {
  TransactionAuthorizationRequest,
  BalanceCache,
  ByTimePeriod,
  UpdateUserRequest,
  CreateUserRequest
} from '../models'
import Controller from './controller'
import { Dependencies } from '../environment'
import UserRepository from '../repositories/userRepository'
import TransactionRepository from '../repositories/transactionRepository'
import { asyncHandler } from '../middleware'

export const enum UserControllerErrorCodes {
  OK = 0,
  Unknown = -1,
  BadCreateUserRequest = 100,
  FailedCreateUserRequest = 101,
  FailedBalanceRequest = 102,
  BadUpdateNameRequest = 103,
  BadUpdateEmailRequest = 104,
  BadUpdatePasswordRequest = 105,
  MissingStartOrEnd = 107,
  BadGetTransactionsRequest = 108,
  FailedGetTransactions = 109,
  FailedGetByMerchant = 110,
  SummaryNotFound = 111,
  AuthorizationFailed = 112
}

export default class UserController implements Controller {
  public path = '/users'

  public router = Router()

  private users: UserRepository

  private transactions: TransactionRepository

  private balanceCache: Promise<BalanceCache>

  constructor(public deps: Dependencies) {
    this.users = deps.repositories.users
    this.transactions = deps.repositories.transactions
    this.balanceCache = deps.balanceCache
    this.registerRoutes()
  }

  private registerRoutes = () => {
    this.router.get(`/users/:userId/balance`, asyncHandler(this.getBalance))
    this.router.get(
      `/users/:userId/transactions/merchant/:merchantId`,
      asyncHandler(this.getByMerchant)
    )
    this.router.get(`/users/:userId/transactions`, asyncHandler(this.getTransactions))
    this.router.get(`/users/:userId/transactions/summarize`, asyncHandler(this.getSummary))

    this.router.post(`/users`, asyncHandler(this.createUser))
    this.router.post(`/users/:userId/transactions/authorize`, asyncHandler(this.authorize))

    this.router.put(`/users/:userId/update/email`, asyncHandler(this.updateEmail))
    this.router.put(`/users/:userId/update/name`, asyncHandler(this.updateName))
    this.router.put(`/users/:userId/update/password`, asyncHandler(this.updatePassword))
  }

  private getSummary = async (req: Request, res: Response) => {
    const { userId } = req.params
    this.transactions
      .summarize(userId)
      .then(value =>
        isRight(value)
          ? res.status(200).json({ code: UserControllerErrorCodes.OK, message: value.right })
          : res
              .status(400)
              .json({ code: UserControllerErrorCodes.SummaryNotFound, message: value.left })
      )
      .catch(err => res.status(500).json({ code: UserControllerErrorCodes.Unknown, message: err }))
  }

  // Instructions seem to indicate that the transaction need not be saved,
  // just authorized against the current balance
  private authorize = async (req: Request, res: Response) => {
    const txnRequest = req.body as TransactionAuthorizationRequest
    const { userId } = req.params
    if (
      isOfType<TransactionAuthorizationRequest>(txnRequest, 'amountInCents') &&
      typeof txnRequest.amountInCents === 'number'
    ) {
      this.transactions
        .authorize(userId, txnRequest)
        .then(authorized =>
          isRight(authorized)
            ? res.status(200).json({ code: UserControllerErrorCodes.OK, message: authorized.right })
            : res.status(400).json({
                code: UserControllerErrorCodes.AuthorizationFailed,
                message: authorized.left
              })
        )
        .catch(err =>
          res.status(500).json({ code: UserControllerErrorCodes.Unknown, message: err })
        )
    } else {
      res.status(400).json({
        code: 100,
        message: `expected TransactionAuthorizationRequest received ${JSON.stringify(txnRequest)}`
      })
    }
  }

  private getByMerchant = async (req: Request, res: Response) => {
    const { userId, merchantId } = req.params

    this.transactions
      .getByMerchant(userId, merchantId)
      .then(value =>
        isRight(value)
          ? res.status(200).json({ code: UserControllerErrorCodes.OK, message: value.right })
          : res
              .status(400)
              .json({ code: UserControllerErrorCodes.FailedGetByMerchant, message: value.left })
      )
      .catch(err => res.status(500).json({ code: UserControllerErrorCodes.Unknown, message: err }))
  }

  private getTransactions = async (req: Request, res: Response) => {
    const { start, end } = (req.query as unknown) as ByTimePeriod
    const { userId } = req.params

    if (!start || !end) {
      res
        .status(400)
        .json({ code: UserControllerErrorCodes.MissingStartOrEnd, message: `missing start or end` })
    } else {
      const validated = validatePeriod(start, end)
      if (isRight(validated)) {
        const [startDate, endDate] = validated.right
        this.transactions
          .getByTime(userId, startDate, endDate)
          .then(value =>
            isRight(value)
              ? res.status(200).json({ code: UserControllerErrorCodes.OK, message: value.right })
              : res.status(400).json({
                  code: UserControllerErrorCodes.FailedGetTransactions,
                  messsage: value.left
                })
          )
          .catch(err =>
            res.status(500).json({ code: UserControllerErrorCodes.Unknown, message: err })
          )
      } else {
        res.status(400).json({
          code: UserControllerErrorCodes.BadGetTransactionsRequest,
          message: validated.left
        })
      }
    }
  }

  private updateEmail = async (req: Request, res: Response) => {
    const { email } = req.body as UpdateUserRequest
    const { userId } = req.params

    if (!email) {
      res.status(400).json({
        code: UserControllerErrorCodes.BadUpdateEmailRequest,
        message: `no email address provided`
      })
    } else {
      this.users
        .updateEmail(userId, email)
        .then(updated =>
          isRight(updated)
            ? res.status(200).json({ code: UserControllerErrorCodes.OK, message: updated.right })
            : res.status(400).json({
                code: UserControllerErrorCodes.BadUpdateEmailRequest,
                message: updated.left
              })
        )
        .catch(err =>
          res.status(500).json({ code: UserControllerErrorCodes.Unknown, message: err })
        )
    }
  }

  private updateName = async (req: Request, res: Response) => {
    const { firstName, lastName } = req.body as UpdateUserRequest
    const { userId } = req.params

    if (!(firstName || lastName)) {
      res.status(400).json({
        code: UserControllerErrorCodes.BadUpdateNameRequest,
        message: `one of the firstName or lastName should be provided`
      })
    } else {
      this.users
        .updateName(userId, firstName, lastName)
        .then(updated =>
          isRight(updated)
            ? res.status(200).json({ code: UserControllerErrorCodes.OK, message: updated.right })
            : res.status(400).json({
                code: UserControllerErrorCodes.BadUpdateNameRequest,
                message: updated.left
              })
        )
        .catch(err =>
          res.status(500).json({ code: UserControllerErrorCodes.Unknown, message: err })
        )
    }
  }

  private updatePassword = async (req: Request, res: Response) => {
    const { password } = req.body as UpdateUserRequest
    const { userId } = req.params

    if (!password) {
      res.status(400).json({
        code: UserControllerErrorCodes.BadUpdatePasswordRequest,
        message: `No password provided`
      })
    } else {
      this.users
        .updatePassword(userId, password)
        .then(updated =>
          isRight(updated)
            ? res.status(200).json({ code: UserControllerErrorCodes.OK, message: updated.right })
            : res.status(400).json({
                code: UserControllerErrorCodes.FailedCreateUserRequest,
                message: updated.left
              })
        )
        .catch(err =>
          res.status(500).json({ code: UserControllerErrorCodes.Unknown, message: err })
        )
    }
  }

  private getBalance = async (req: Request, res: Response) => {
    const { userId } = req.params

    this.balanceCache
      .then(cache => {
        const hit = cache[userId]
        return hit
          ? res.status(200).json({ code: UserControllerErrorCodes.OK, message: hit })
          : res.status(400).json({
              code: UserControllerErrorCodes.FailedCreateUserRequest,
              message: `${userId} not found`
            })
      })
      .catch(err => res.status(500).json({ code: UserControllerErrorCodes.Unknown, message: err }))
  }

  private createUser = async (req: Request, res: Response) => {
    if (isOfType<CreateUserRequest>(req.body, 'password', 'email', 'firstName', 'lastName')) {
      const { email, firstName, lastName, password } = req.body
      this.users
        .create(email, firstName, lastName, password)
        .then(inserted =>
          isRight(inserted)
            ? res.status(201).json({ code: UserControllerErrorCodes.OK, message: inserted.right })
            : res.status(400).json({
                code: UserControllerErrorCodes.FailedCreateUserRequest,
                message: inserted.left
              })
        )
        .catch(err =>
          res.status(500).json({ code: UserControllerErrorCodes.Unknown, message: err })
        )
    } else {
      res.status(400).send({
        code: UserControllerErrorCodes.BadCreateUserRequest,
        message: `expected CreateUserRequest received ${JSON.stringify(req.body)}`
      })
    }
  }
}
