import {
  CareerApplicationStatus,
  CareerOpportunityType,
  EmploymentType,
  JobStatus,
  WorkMode,
} from '@prisma/client';

export interface CreateJobInput {
  title: string;
  slug: string;
  department?: string;
  location: string;
  employmentType: EmploymentType;
  opportunityType?: CareerOpportunityType;
  workMode: WorkMode;
  durationMonths?: number | null;
  monthlyFee?: number | null;
  description: string;
  responsibilities: string[];
  requirements: string[];
  salaryRange?: string;
  status?: JobStatus;
  deadline?: Date | null;
  closesAt?: Date | null;
}

export interface UpdateJobInput extends Partial<CreateJobInput> {}

export interface CreateApplicationInput {
  jobId?: string;
  name: string;
  email: string;
  phone?: string;
  coverLetter?: string;
  resumeUrl?: string;
  paymentProofKey?: string;
  paymentProofOriginalName?: string;
  paymentProofMimeType?: string;
  paymentProofSize?: number;
  paymentStatus?: "NOT_SUBMITTED" | "PENDING_VERIFICATION";
}

export interface UpdateApplicationInput {
  status?: CareerApplicationStatus;
  adminNote?: string | null;
  paymentStatus?: "NOT_SUBMITTED" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
}