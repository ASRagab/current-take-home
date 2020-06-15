INSERT INTO merchants(name, latitude, longitude)
SELECT DISTINCT merchant, latitude, longitude
FROM seed;

INSERT INTO users(email, first_name, last_name, password)
SELECT DISTINCT ON (email) email, firstname, lastname, password
FROM seed;

UPDATE users
SET password = crypt(password, gen_salt('bf', 8));

INSERT INTO transactions(user_id, merchant_id, amount_in_cents, timestamp)
SELECT u.user_id, m.merchant_id, s.amountincents, to_timestamp(s.createdat / 1000)
FROM seed s
         INNER JOIN users u on s.email = u.email
         INNER JOIN merchants m on s.merchant = m.name AND s.latitude = m.latitude AND s.longitude = m.longitude;