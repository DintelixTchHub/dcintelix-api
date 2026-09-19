-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "CareerApplicationStatus" AS ENUM ('RECEIVED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED');

-- CreateTable
CREATE TABLE "CareerJob" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "department" TEXT,
    "location" TEXT NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "description" TEXT NOT NULL,
    "responsibilities" TEXT[] NOT NULL,
    "requirements" TEXT[] NOT NULL,
    "salaryRange" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerApplication" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "coverLetter" TEXT,
    "resumeUrl" TEXT,
    "status" "CareerApplicationStatus" NOT NULL DEFAULT 'RECEIVED',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareerJob_slug_key" ON "CareerJob"("slug");
CREATE INDEX "CareerJob_status_createdAt_idx" ON "CareerJob"("status", "createdAt" DESC);
CREATE INDEX "CareerJob_department_idx" ON "CareerJob"("department");
CREATE INDEX "CareerApplication_jobId_idx" ON "CareerApplication"("jobId");
CREATE INDEX "CareerApplication_status_createdAt_idx" ON "CareerApplication"("status", "createdAt" DESC);
CREATE INDEX "CareerApplication_email_idx" ON "CareerApplication"("email");

-- AddForeignKey
ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "CareerJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;