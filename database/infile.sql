DROP TABLE IF EXISTS "User";
DROP TABLE IF EXISTS "users";
DROP TABLE IF EXISTS "user";

Create or replace function random_string(length integer) returns text as
$$
declare
  chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}';
  result text := '';
  i integer := 0;
begin
  if length < 0 then
    raise exception 'Given length cannot be less than 0';
  end if;
  for i in 1..length loop
    result := result || chars[1+random()*(array_length(chars, 1)-1)];
  end loop;
  return result;
end;
$$ language plpgsql;

CREATE TABLE public.users (
  id                  SERIAL        PRIMARY KEY NOT NULL,
  "registrationDate"  TIMESTAMP     DEFAULT now(),
  email               varchar(255)  UNIQUE NOT NULL,
  "phoneNumber"       BIGINT,
  "firstName"         varchar(255)  NOT NULL,
  "lastName"          varchar(255)  NOT NULL,
  relation            char(7)       NOT NULL,
  school              char(255)     NOT NULL,
  teacher             char(255),
  grade               smallint,
  "latinLevel"        varchar(7),
  "joinCode"          varchar(6)    UNIQUE DEFAULT random_string(5),
  joined              BOOLEAN       DEFAULT FALSE,
  "discordId"         varchar(19)   UNIQUE
);

COPY users(id, "registrationDate", email, "phoneNumber", "firstName", "lastName", relation, school, teacher, grade, "latinLevel") FROM '/docker-entrypoint-initdb.d/2020_SCRAM_Registration-db_infile.csv' DELIMITER ',' CSV HEADER;
