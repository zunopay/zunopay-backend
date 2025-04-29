/*
  Warnings:

  - A unique constraint covering the columns `[signature]` on the table `Transfer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Transfer" ALTER COLUMN "reference" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_signature_key" ON "Transfer"("signature");
