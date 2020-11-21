CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/* DROP TABLE IF EXISTS "User";  */
DROP TABLE IF EXISTS "users";
DROP TABLE IF EXISTS "user";
DROP TABLE IF EXISTS "Events";

CREATE OR REPLACE FUNCTION "randomString"(LENGTH INTEGER) RETURNS TEXT AS
$$
DECLARE
  chars TEXT[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  IF LENGTH < 0 THEN
    raise exception 'Given length cannot be less than 0';
  END IF;
  for i IN 1..LENGTH LOOP
    result := result || chars[1+random()*(array_length(chars, 1)-1)];
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "testInsertBeforeFunc"()
RETURNS TRIGGER AS $BODY$
DECLARE
  EXISTS VARCHAR(255); 
BEGIN
  UPDATE "User" SET "firstName"=new."firstName"
  WHERE "email"=new."email"
  RETURNING "email" INTO EXISTS;

  -- If the above was successful, it would return non-null
  -- in that case we return NULL so that the triggered INSERT
  -- does not proceed
  IF EXISTS IS NOT NULL THEN
    RETURN NULL;
  END IF;

  -- Otherwise, return the new record so that triggered INSERT
  -- goes ahead
  RETURN new;
END; 
$BODY$
LANGUAGE 'plpgsql' SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS public."User" (
  "email"             VARCHAR(255)  PRIMARY KEY NOT NULL,
  "registrationDate"  TIMESTAMP     DEFAULT now(),
  "phoneNumber"       BIGINT,
  "firstName"         VARCHAR(255)  NOT NULL,
  "lastName"          VARCHAR(255)  NOT NULL,
  "relation"          CHAR(9)       NOT NULL,
  "school"            VARCHAR(255)  NOT NULL,
  "teacher"           VARCHAR(255),
  "grade"             SMALLINT,
  "latinLevel"        VARCHAR(7),
  "joinCode"          VARCHAR(6)    UNIQUE DEFAULT "randomString"(5),
  "joined"            BOOLEAN       DEFAULT FALSE,
  "discordId"         VARCHAR(19)   UNIQUE
);

DROP TRIGGER IF EXISTS "testInsertBeforeTrigger" on public."User";

CREATE TRIGGER "testInsertBeforeTrigger"
  BEFORE INSERT
  ON "User"
  FOR EACH ROW
  EXECUTE PROCEDURE "testInsertBeforeFunc"();

/* COPY "User"("email", "registrationDate", "phoneNumber", "firstName", "lastName", "relation", "school", "teacher", "grade", "latinLevel") FROM '/docker-entrypoint-initdb.d/2020_SCRAM_Registration-db_infile.csv' DELIMITER ',' CSV HEADER; */ 

/* ******************************************************************* */
/* ListenChannel includes all discord channels to listen to for reacts */
/* ******************************************************************* */

/* DROP TABLE IF EXISTS "ListenChannel"; */

CREATE TABLE IF NOT EXISTS public."ListenChannel" (
  "channelId"  varchar(19)  PRIMARY KEY NOT NULL
);

INSERT INTO "ListenChannel" VALUES ('778802296921784342') ON CONFLICT DO NOTHING;

/* ******************************************************************* */
/*  */
/* ******************************************************************* */

/* DROP TABLE IF EXISTS "EventSubscription";
DROP TABLE IF EXISTS "Event"; */

CREATE TABLE IF NOT EXISTS public."Event" (
  "id"          UUID            PRIMARY KEY NOT NULL DEFAULT UUID_GENERATE_V4(),
  "name"        VARCHAR(255)    NOT NULL,
  "description" TEXT,
  "link"        VARCHAR(255),
  "startTime"   TIMESTAMP       NOT NULL,
  "endTime"     TIMESTAMP       NOT NULL,
  "private"     BOOLEAN         NOT NULL DEFAULT FALSE,
  "messageId"   VARCHAR(255)    UNIQUE
);

CREATE TABLE IF NOT EXISTS public."EventSubscription" (
  "id"          SERIAL        PRIMARY KEY NOT NULL,
  "userEmail"   VARCHAR(255)  NOT NULL,
  "eventId"     UUID          NOT NULL,
  "notify"      BOOLEAN       NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public."Introduction" (
  "discordId"   VARCHAR(19)   PRIMARY KEY NOT NULL,
  "sent"        BOOLEAN       DEFAULT FALSE,
  CONSTRAINT "fk_discordId" FOREIGN KEY ("discordId") REFERENCES "User" ("discordId")
);
