CREATE OR REPLACE FUNCTION encrypt_password()
    RETURNS trigger AS
$$
BEGIN
   IF OLD.password IS NULL OR OLD.password <> NEW.password THEN
      NEW.password = crypt(NEW.password, gen_salt('bf', 8));
      RETURN NEW;
END;
$$
    LANGUAGE 'plpgsql';


CREATE TRIGGER encrypt_trigger
    BEFORE INSERT OR UPDATE
    ON users
    FOR EACH ROW
EXECUTE PROCEDURE encrypt_password();