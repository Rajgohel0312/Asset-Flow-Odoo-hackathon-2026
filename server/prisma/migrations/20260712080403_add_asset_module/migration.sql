-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('ACTIVE', 'RETURNED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'MISSING', 'DAMAGED');

-- CreateTable
CREATE TABLE "asset_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultMaintenanceDays" INTEGER NOT NULL DEFAULT 0,
    "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "assetTag" TEXT NOT NULL,
    "serialNumber" TEXT,
    "categoryId" UUID NOT NULL,
    "departmentId" UUID,
    "assetName" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "warrantyExpiry" TIMESTAMP(3),
    "location" TEXT,
    "condition" "AssetCondition" NOT NULL DEFAULT 'GOOD',
    "status" "AssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    "qrCode" TEXT,
    "image" TEXT,
    "isBookable" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_documents" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assets_assetTag_key" ON "assets"("assetTag");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_documents" ADD CONSTRAINT "asset_documents_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_documents" ADD CONSTRAINT "asset_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
