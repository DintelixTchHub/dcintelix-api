-- CreateEnum
CREATE TYPE "CareerOpportunityType" AS ENUM ('JOB', 'TRAINING');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'ONSITE', 'HYBRID');

-- AlterTable
ALTER TABLE "CareerJob"
ADD COLUMN "opportunityType" "CareerOpportunityType" NOT NULL DEFAULT 'TRAINING',
ADD COLUMN "workMode" "WorkMode" NOT NULL DEFAULT 'REMOTE';