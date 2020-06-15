# Current

> [https://current-u6upn3rllq-uk.a.run.app](https://current-u6upn3rllq-uk.a.run.app)

## Overview

Typescript/Express API running in GCP (School Account) using Cloud Run/Cloud SQL

## Run Tests

`npm run test`

## Infrastructure

All Infrastructure is Terraformed see `./deploy`

## Deploy

Environment Variables are located in `.envrc` and `.deploy/deploy.sh --with-docker` will use those env vars to do the following:

- build container
- push tag to `gcr.io`
- terraform apply
- run flyway migrations

## Routes

### Get Balance For User

`/users/d8ed8864-b82f-4b5b-a064-d74c664c7715/balance`

### Get User Transactions by Merchant

`/users/056b6a9b-a119-4c85-86c4-e94cf280806f/transactions/merchant/cb21b581-cd5d-46c0-8d9a-c054ddaeeb92`

### Get User Transactions by Start and End Date

`/users/5ff1bc53-93c3-478c-a328-2062effaddbf/transactions?start=2018-01-01&end=2019-01-01`

### Get Summary User Transactions

`/users/45ee9314-f9b5-4e1f-aac8-c0afc2ce9d23/transactions/summarize`

### Post Create User

`/users`

Body:

```json
{
  "email": "test16@test.com",
  "firstName": "Soraya",
  "lastName": "Lanza",
  "password": "hello123"
}
```

### Post Authorize Transactions

`/users/7fa7f133-6919-4893-88d4-885dcf22200f/transactions/authorize`

Body:

```json
{
  "amountInCents": 233433344
}
```

### Put Update Email/Password/Name

#### Notes

- Routes are authed using basic auth

`/users/7169ef9f-f922-4a37-b1be-9bef9582f448/update/email`
`/users/d8ed8864-b82f-4b5b-a064-d74c664c7715/update/password`
`/users/d8ed8864-b82f-4b5b-a064-d74c664c7715/update/name`

```json
//Email
{
	"email": "test12@test.com"
}

// Password
{
	"password": "afa;dfslm"
}

// Name
{
  "firstName": "Sandra"
  "lastName": "Oh"  // only one is reqquired
}
```

### PUT Update Merchant with Google Places API

`/merchants/d67d9bd4-e889-4961-b523-cd6c78acbdc7/update`

## Places For Update:

- Repository Tests
- Postman Collection
- DRY up error handling
- Cleanup Queries / More Types
