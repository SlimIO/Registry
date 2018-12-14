CREATE TABLE IF NOT EXISTS "addons" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "name" VARCHAR(35),
    "description" VARCHAR(120),
    "version" VARCHAR(20),
    "author" VARCHAR(25),
    "git" VARCHAR(120)
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "username" VARCHAR(40) NOT NULL,
    "password" VARCHAR(240) NOT NULL,
    "admin" BOOLEAN INTEGER NOT NULL
);
