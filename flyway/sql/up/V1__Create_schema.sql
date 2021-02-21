CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users
(
    user_id    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name text NOT NULL,
    last_name  text NOT NULL,
    email      text NOT NULL,
    password   text NOT NULL
);

CREATE UNIQUE INDEX index_users_email ON users(lower(email));

CREATE TABLE IF NOT EXISTS merchants
(
    merchant_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        text NOT NULL,
    latitude    NUMERIC(11, 7),
    longitude   NUMERIC(11, 7),
    address     text
);

CREATE TABLE IF NOT EXISTS transactions
(
    transaction_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        uuid REFERENCES users (user_id),
    merchant_id    uuid REFERENCES merchants (merchant_id),
    amountInCents  DECIMAL(12, 2),
    timestamp      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);