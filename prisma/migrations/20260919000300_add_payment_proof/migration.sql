-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "CareerApplication"
ADD COLUMN "paymentProofKey" TEXT,
ADD COLUMN "paymentProofOriginalName" TEXT,
ADD COLUMN "paymentProofMimeType" TEXT,
ADD COLUMN "paymentProofSize" INTEGER,
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_SUBMITTED';