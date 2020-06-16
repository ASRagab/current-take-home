CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    login TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at timestamp NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_unique_name_login ON user_roles(name, login);
