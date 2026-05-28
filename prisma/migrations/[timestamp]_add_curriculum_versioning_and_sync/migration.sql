-- AlterEnum
ALTER TYPE "CurriculumType" ADD VALUE 'QURANIC';
ALTER TYPE "CurriculumType" ADD VALUE 'CUSTOM';
ALTER TYPE "CurriculumType" ADD VALUE 'PROFESSIONAL';

-- CreateEnum
CREATE TYPE "VersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED', 'PARTIAL');

-- AlterTable Curriculum
ALTER TABLE "Curriculum" ADD COLUMN "type" "CurriculumType" NOT NULL DEFAULT 'NATIONAL',
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateTable CurriculumVersion
CREATE TABLE "CurriculumVersion" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "VersionStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT,
    "description" TEXT,
    "changelog" TEXT,
    "metadata" JSONB,
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable CurriculumSync
CREATE TABLE "CurriculumSync" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "version" INTEGER,
    "syncedAt" TIMESTAMP(3),
    "syncedBy" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable CurriculumPublicationLog
CREATE TABLE "CurriculumPublicationLog" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "publishedBy" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurriculumPublicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumVersion_curriculumId_version_key" ON "CurriculumVersion"("curriculumId", "version");
CREATE INDEX "CurriculumVersion_curriculumId_idx" ON "CurriculumVersion"("curriculumId");
CREATE INDEX "CurriculumVersion_status_idx" ON "CurriculumVersion"("status");
CREATE INDEX "CurriculumVersion_publishedAt_idx" ON "CurriculumVersion"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumSync_curriculumId_schoolId_key" ON "CurriculumSync"("curriculumId", "schoolId");
CREATE INDEX "CurriculumSync_curriculumId_idx" ON "CurriculumSync"("curriculumId");
CREATE INDEX "CurriculumSync_schoolId_idx" ON "CurriculumSync"("schoolId");
CREATE INDEX "CurriculumSync_status_idx" ON "CurriculumSync"("status");
CREATE INDEX "CurriculumSync_syncedAt_idx" ON "CurriculumSync"("syncedAt");

-- CreateIndex
CREATE INDEX "CurriculumPublicationLog_curriculumId_idx" ON "CurriculumPublicationLog"("curriculumId");
CREATE INDEX "CurriculumPublicationLog_action_idx" ON "CurriculumPublicationLog"("action");
CREATE INDEX "CurriculumPublicationLog_createdAt_idx" ON "CurriculumPublicationLog"("createdAt");

-- AddForeignKey
ALTER TABLE "CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumSync" ADD CONSTRAINT "CurriculumSync_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumSync" ADD CONSTRAINT "CurriculumSync_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumPublicationLog" ADD CONSTRAINT "CurriculumPublicationLog_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex for Curriculum table
CREATE INDEX "Curriculum_type_idx" ON "Curriculum"("type");
CREATE INDEX "Curriculum_deletedAt_idx" ON "Curriculum"("deletedAt");
