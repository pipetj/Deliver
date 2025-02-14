/*
  Warnings:

  - You are about to drop the `Item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rune` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BuildItems` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BuildRunes` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `items` to the `Build` table without a default value. This is not possible if the table is not empty.
  - Added the required column `runes` to the `Build` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_BuildItems_B_index";

-- DropIndex
DROP INDEX "_BuildItems_AB_unique";

-- DropIndex
DROP INDEX "_BuildRunes_B_index";

-- DropIndex
DROP INDEX "_BuildRunes_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Item";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Rune";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_BuildItems";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_BuildRunes";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Build" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "champion" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "runes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Build_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Build" ("champion", "createdAt", "id", "userId") SELECT "champion", "createdAt", "id", "userId" FROM "Build";
DROP TABLE "Build";
ALTER TABLE "new_Build" RENAME TO "Build";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
