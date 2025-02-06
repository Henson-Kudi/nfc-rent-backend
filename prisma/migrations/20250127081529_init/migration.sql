/*
  Warnings:

  - A unique constraint covering the columns `[userId,device]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Session_userId_device_location_key";

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "location" DROP NOT NULL;

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "params" TEXT[],
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "receipient" TEXT NOT NULL,
    "receipientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expireAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationTemplate_createdBy_slug_idx" ON "NotificationTemplate"("createdBy", "slug");

-- CreateIndex
CREATE INDEX "NotificationTemplate_createdBy_name_idx" ON "NotificationTemplate"("createdBy", "name");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_createdBy_slug_key" ON "NotificationTemplate"("createdBy", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_createdBy_name_key" ON "NotificationTemplate"("createdBy", "name");

-- CreateIndex
CREATE INDEX "Notification_receipientId_idx" ON "Notification"("receipientId");

-- CreateIndex
CREATE INDEX "Notification_receipient_idx" ON "Notification"("receipient");

-- CreateIndex
CREATE UNIQUE INDEX "Session_userId_device_key" ON "Session"("userId", "device");
