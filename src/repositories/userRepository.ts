import { Either } from 'fp-ts/lib/Either'

export default interface UserRepository {
  create(
    email: string,
    firstName: string,
    lastName: string,
    password: string
  ): Promise<Either<string, string>>

  updateEmail(userId: string, email: string): Promise<Either<string, string>>
  updatePassword(userId: string, password: string): Promise<Either<string, string>>
  updateName(
    userId: string,
    firstName: string | undefined,
    lastName: string | undefined
  ): Promise<Either<string, string>>

  getUserBalance(userId: string): Promise<Either<string, number>>
}
