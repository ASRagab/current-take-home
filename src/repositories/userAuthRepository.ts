import basicAuth from 'express-basic-auth'

export default interface UserAuthRepository {
  authorizer(
    email: string | undefined,
    password: string | undefined,
    cb: basicAuth.AsyncAuthorizerCallback
  ): Promise<void>
}
