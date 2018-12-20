-- adding users
CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "username" VARCHAR(40) NOT NULL,
    "password" VARCHAR(240) NOT NULL
);

-- adding organisations
CREATE TABLE IF NOT EXISTS "orga" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "name" VARCHAR(25) NOT NULL
);

-- distribution of rights
CREATE TABLE IF NOT EXISTS "slimio_user" (
    "user_id" INTEGER NOT NULL,
    "orga_id" INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS "private_user" (
    "user_id" INTEGER NOT NULL,
    "orga_id" INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS "public_user" (
    "user_id" INTEGER NOT NULL,
    "orga_id" INTEGER NOT NULL
);

-- adding addons
CREATE TABLE IF NOT EXISTS "addons" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "name" VARCHAR(35),
    "description" VARCHAR(120),
    "version" VARCHAR(20),
    "author" VARCHAR(25),
    "git" VARCHAR(120)
);
