-- CreateEnum
CREATE TYPE "OrganisationState" AS ENUM ('CREATED', 'DB_INITIALISED');

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" "OrganisationState" NOT NULL DEFAULT 'CREATED',
    "nameSlug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collaboration" (
    "collaboratorId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "roles" TEXT[]
);

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_nameSlug_ownerId_key" ON "Organisation"("nameSlug", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Collaboration_collaboratorId_organisationId_key" ON "Collaboration"("collaboratorId", "organisationId");

-- AddForeignKey
ALTER TABLE "Organisation" ADD CONSTRAINT "Organisation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
