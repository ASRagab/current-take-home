/* eslint-disable no-unused-vars */
import express, { Application } from 'express'
import basicAuth from 'express-basic-auth'
import compression from 'compression'
import { Environment, Dependencies } from './environment'
import { getUnauthorizedResponse } from './utils'
import UserAuthRepository from './repositories/userAuthRepository'
import Controller from './controllers/controller'
import { globalErrorHandler, requestLogger } from './middleware'

export default class App {
  private auth: UserAuthRepository

  constructor(
    public app: Application,
    public readonly env: Environment,
    public readonly deps: Dependencies,
    private readonly controllers: Controller[]
  ) {
    const { auth } = deps.repositories

    this.auth = auth

    this.registerMiddleware()
    this.registerControllers()
    this.registerAfterware()
  }

  public listen = () =>
    this.app.listen(this.env.port, () => {
      console.log(`Listening at http://localhost:${this.env.port}`)
    })

  private registerControllers = () => {
    this.controllers.forEach(controller => {
      this.app.use('/', controller.router)
    })
  }

  private registerMiddleware = () => {
    this.app
      .use(express.json())
      .use(compression())
      .use(requestLogger())
      .use(
        '/users/:userId/update', // TODO: Not hardcode this
        basicAuth({
          unauthorizedResponse: getUnauthorizedResponse,
          authorizeAsync: true,
          authorizer: (user, pass, cb) => this.auth.authorizer(user, pass, cb),
          challenge: true
        })
      )
  }

  private registerAfterware = () => {
    this.app
      .use((req, res, next) => {
        res.status(404).json({ code: -100, message: `'${req.url}' not found` })
      })
      .use(globalErrorHandler)
  }
}
