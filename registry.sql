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
    ('cpu', 'addon cpu', '1.0.0', 'SlimIO', 'https://github.com/SlimIO/cpu.git'),
    ('Winmem', 'addon winem', '1.1.0', 'SlimIO', 'https://github.com/SlimIO/Winmem.git');
