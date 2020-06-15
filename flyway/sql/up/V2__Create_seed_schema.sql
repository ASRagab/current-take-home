CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS seed
(
    firstName     text,
    lastName      text,
    email         text,
    "password"    text,
    walletId      uuid,
    longitude     NUMERIC(12, 7),
    latitude      NUMERIC(12, 7),
    merchant      text,
    amountInCents DECIMAL(12, 2),
    createdAt     BIGINT
);
