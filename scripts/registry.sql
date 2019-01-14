-- adding users
CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "username" VARCHAR(40) NOT NULL,
    "password" VARCHAR(240) NOT NULL
);

-- adding addons
CREATE TABLE IF NOT EXISTS "addons" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "name" VARCHAR(35) NOT NULL,
    "description" VARCHAR(120),
    "version" VARCHAR(20) NOT NULL,
    "author" INTEGER NOT NULL,
    "git" VARCHAR(120) NOT NULL
);
