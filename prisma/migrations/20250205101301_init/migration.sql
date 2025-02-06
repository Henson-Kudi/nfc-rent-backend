-- CreateEnum
CREATE TYPE "OrganisationModuleState" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "OrganisationModule" (
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameSlug" TEXT NOT NULL,
    "state" "OrganisationModuleState" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX "OrganisationModule_organisationId_nameSlug_idx" ON "OrganisationModule"("organisationId", "nameSlug");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationModule_organisationId_nameSlug_key" ON "OrganisationModule"("organisationId", "nameSlug");

-- AddForeignKey
ALTER TABLE "OrganisationModule" ADD CONSTRAINT "OrganisationModule_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
