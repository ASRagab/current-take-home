# Overview

The goal of this assessment is to create an API for bank account users. The database for this API should be seeded with the following csv: https://cdn.current.com/code-assignment/sample-data.zip

# Schema

```
User {
  userId
  firstName
  lastName
  email
  password
}
```

```
Merchant {
  merchantId
  name
  latitude
  longitude
  address
}
```

```
Transaction {
  userId
  merchantId
  amountInCents
  timestamp
}
```

# Required operations

1. Create a new user (_25 points_)

- Avoid duplicates on the user profile by email address
- Generate a userId for a new user
- Do not store the password in plain text

2. Update a user (_25 points_)

- Update the first or the last name
- Update email
- Update password
- _Bonus: authenticate the update operation with basic auth using the email and password_ (_10 points_)

3. Retrieve a user balance (_25 points_)

- For all the transactions for a userId, sum the amountInCents. This derives the user balance. amountInCents can be positive (a credit) or negative (a debit)

4. Authorize a transaction by balance (_25 points_)

- Add an endpoint which makes a request to a user with a transaction
- If the user has sufficient balance for the transaction, return an approval code
- If the user has insufficient balance for the transaction, return a decline code
- Query should return to the client in 1000ms or less

# Additional requirements

1. Unit tests
2. Input validation
3. API should be publically accessible

# Bonus operations

1. Add the ability to recieve transactions for a user

- Lookup between a starting and ending timestamp (_5 points_)
- Lookup by merchantId (_5 points_)
- Add pagination to both queries (_5 points_)

2. Summarize the amount a user has spent at each merchant (_10 points_)

3. Enrich merchants with a google place location using the Google Places API (_15 points_)

# Grading

The maximum score for the assignment is 150 points. 90 points is the passing grade. If you assignment fails to pass, you will be provided your grade with the reasons why.

# Delivery

Once complete, please attach @finco-trevor and @maksymseleznov as a git project collaborators. Please make sure the link to your endpoint is provided in the README.
