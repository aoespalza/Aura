CREATE TABLE "SpecialDate" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "name"         TEXT NOT NULL,
  "month"        INTEGER NOT NULL,
  "day"          INTEGER NOT NULL,
  "type"         TEXT NOT NULL,
  "notes"        TEXT,
  "reminderDays" INTEGER NOT NULL DEFAULT 3,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
