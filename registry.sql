CREATE TABLE IF NOT EXISTS "addons" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "name" VARCHAR(35),
    "description" VARCHAR(120),
    "version" VARCHAR(20),
    "author" VARCHAR(25),
    "git" VARCHAR(120)
);

INSERT INTO "addons"
    ("name", "description", "version", "author", "git")
VALUES
    ("cpu", "addon cpu", "1.0.0", "SlimIO", "https://github.com/SlimIO/cpu.git"),
    ("Winmem", "addon winem", "1.1.0", "SlimIO", "https://github.com/SlimIO/Winmem.git");

CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "username" VARCHAR(40),
    "password" VARCHAR(40),
    "admin" BOOLEAN INTEGER NOT NULL
);

INSERT INTO "users"
    ("username", "password", "admin")
VALUES
    ("irvin", "admin", "1"),
    ("thomas", "admin", "1"),
    ("alexandre", "admin", "1"),
    ("marko", "admin", "1"),
    ("guest", "guest", "0");
