-- AlterTable
ALTER TABLE "Shop" ADD COLUMN "s3BucketSlug" TEXT NOT NULL,
ADD COLUMN "shopFront" TEXT NOT NULL,
ADD COLUMN "slug" TEXT NOT NULL,
ADD COLUMN "taxNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "s3BucketSlug" TEXT;

-- UpdateTable
UPDATE "User" SET "s3BucketSlug" = "username";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "s3BucketSlug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Shop_s3BucketSlug_key" ON "Shop"("s3BucketSlug");

-- CreateIndex
CREATE UNIQUE INDEX "User_s3BucketSlug_key" ON "User"("s3BucketSlug");
