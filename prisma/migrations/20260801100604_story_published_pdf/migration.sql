-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "gradeMin" INTEGER NOT NULL,
    "gradeMax" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "pdfPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Story" ("body", "gradeMax", "gradeMin", "id", "slug", "summary", "title") SELECT "body", "gradeMax", "gradeMin", "id", "slug", "summary", "title" FROM "Story";
DROP TABLE "Story";
ALTER TABLE "new_Story" RENAME TO "Story";
CREATE UNIQUE INDEX "Story_slug_key" ON "Story"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
