import {
  CareerApplicationStatus,
  CareerOpportunityType,
  PaymentStatus,
  EmploymentType,
  JobStatus,
  WorkMode,
} from "@prisma/client";
import { createError } from "../middleware/errorHandler";
import {
  CreateApplicationInput,
  CreateJobInput,
  UpdateApplicationInput,
  UpdateJobInput,
} from "./careers.types";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlRegex = /^https?:\/\/\S+$/i;

const text = (
  value: unknown,
  field: string,
  required = true,
): string | undefined => {
  if (value === undefined || value === null || value === "") {
    if (required) throw createError(`${field} is required`, 400);
    return undefined;
  }
  if (typeof value !== "string" || !value.trim())
    throw createError(`${field} must be a non-empty string`, 400);
  return value.trim();
};

const list = (value: unknown, field: string): string[] => {
  if (!Array.isArray(value) || value.length === 0)
    throw createError(`${field} must contain at least one item`, 400);
  return value.map((item) => text(item, field) as string);
};

const oneOf = <T extends string>(
  value: unknown,
  values: readonly T[],
  field: string,
): T => {
  if (typeof value !== "string" || !values.includes(value as T))
    throw createError(`Invalid ${field}`, 400);
  return value as T;
};

const parseDate = (value: unknown, field: string): Date => {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime()))
    throw createError(`${field} must be a valid date`, 400);
  return date;
};

const positiveInteger = (value: unknown, field: string): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 120)
    throw createError(`${field} must be a whole number between 1 and 120`, 400);
  return parsed;
};

const monthlyFee = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || Math.round(parsed * 100) !== parsed * 100)
    throw createError("Monthly fee must be a valid non-negative amount with up to 2 decimals", 400);
  return parsed;
};

const validateDeliveryMode = (
  opportunityType: CareerOpportunityType,
  employmentType: EmploymentType,
  workMode: WorkMode,
): void => {
  if (
    (opportunityType === CareerOpportunityType.TRAINING ||
      employmentType === EmploymentType.INTERNSHIP) &&
    workMode !== WorkMode.REMOTE
  ) {
    throw createError(
      "Training and internship opportunities must use remote delivery",
      400,
    );
  }
};

const validateTrainingDetails = (
  opportunityType: CareerOpportunityType,
  durationMonths: number | null | undefined,
  fee: number | null | undefined,
): void => {
  if (opportunityType !== CareerOpportunityType.TRAINING) return;
  if (durationMonths === undefined || durationMonths === null)
    throw createError("Duration in months is required for training", 400);
  if (fee === undefined || fee === null)
    throw createError("Monthly fee is required for training", 400);
};

export const validateCreateJob = (
  body: Record<string, unknown>,
): CreateJobInput => {
  const opportunityType = body.opportunityType === undefined
    ? CareerOpportunityType.TRAINING
    : oneOf(body.opportunityType, Object.values(CareerOpportunityType), "opportunity type");
  const employmentType = oneOf(
    body.employmentType,
    Object.values(EmploymentType),
    "employment type",
  );
  const workMode = body.workMode === undefined
    ? WorkMode.REMOTE
    : oneOf(body.workMode, Object.values(WorkMode), "work mode");
  validateDeliveryMode(opportunityType, employmentType, workMode);
  const durationMonths = body.durationMonths === undefined
    ? undefined
    : positiveInteger(body.durationMonths, "Duration in months");
  const fee = body.monthlyFee === undefined
    ? undefined
    : monthlyFee(body.monthlyFee);
  validateTrainingDetails(opportunityType, durationMonths, fee);
  return {
    title: text(body.title, "Title") as string,
    slug: (text(body.slug, "Slug") as string).toLowerCase().replace(/\s+/g, "-"),
    department: text(body.department, "Department", false),
    location: text(body.location, "Location") as string,
    employmentType,
    opportunityType,
    workMode,
    durationMonths: opportunityType === CareerOpportunityType.TRAINING ? durationMonths : null,
    monthlyFee: opportunityType === CareerOpportunityType.TRAINING ? fee : null,
    description: text(body.description, "Description") as string,
    responsibilities: list(body.responsibilities, "Responsibilities"),
    requirements: list(body.requirements, "Requirements"),
    salaryRange: text(body.salaryRange, "Salary range", false),
    status:
    body.status === undefined
      ? undefined
      : oneOf(body.status, Object.values(JobStatus), "job status"),
    closesAt:
    body.closesAt === undefined
      ? undefined
      : parseDate(body.closesAt, "Close date"),
  };
};

export const validateUpdateJob = (
  body: Record<string, unknown>,
  current?: Pick<CreateJobInput, "opportunityType" | "employmentType" | "workMode" | "durationMonths" | "monthlyFee">,
): UpdateJobInput => {
  const input: UpdateJobInput = {};
  if (body.title !== undefined)
    input.title = text(body.title, "Title") as string;
  if (body.slug !== undefined)
    input.slug = (text(body.slug, "Slug") as string)
      .toLowerCase()
      .replace(/\s+/g, "-");
  if (body.department !== undefined)
    input.department = text(body.department, "Department", false);
  if (body.location !== undefined)
    input.location = text(body.location, "Location") as string;
  if (body.employmentType !== undefined)
    input.employmentType = oneOf(
      body.employmentType,
      Object.values(EmploymentType),
      "employment type",
    );
  if (body.opportunityType !== undefined)
    input.opportunityType = oneOf(
      body.opportunityType,
      Object.values(CareerOpportunityType),
      "opportunity type",
    );
  if (body.workMode !== undefined)
    input.workMode = oneOf(body.workMode, Object.values(WorkMode), "work mode");
  if (body.durationMonths !== undefined)
    input.durationMonths = positiveInteger(body.durationMonths, "Duration in months");
  if (body.monthlyFee !== undefined)
    input.monthlyFee = monthlyFee(body.monthlyFee);
  if (body.description !== undefined)
    input.description = text(body.description, "Description") as string;
  if (body.responsibilities !== undefined)
    input.responsibilities = list(body.responsibilities, "Responsibilities");
  if (body.requirements !== undefined)
    input.requirements = list(body.requirements, "Requirements");
  if (body.salaryRange !== undefined)
    input.salaryRange = text(body.salaryRange, "Salary range", false);
  if (body.status !== undefined)
    input.status = oneOf(body.status, Object.values(JobStatus), "job status");
  if (body.closesAt !== undefined)
    input.closesAt = parseDate(body.closesAt, "Close date");
  if (input.opportunityType || input.employmentType || input.workMode || current) {
    const opportunityType = input.opportunityType ?? current?.opportunityType ?? CareerOpportunityType.TRAINING;
    const employmentType = input.employmentType ?? current?.employmentType ?? EmploymentType.FULL_TIME;
    const workMode = input.workMode ?? current?.workMode ?? WorkMode.REMOTE;
    validateDeliveryMode(opportunityType, employmentType, workMode);
    const durationMonths = input.durationMonths ?? current?.durationMonths;
    const fee = input.monthlyFee ?? current?.monthlyFee;
    validateTrainingDetails(opportunityType, durationMonths, fee);
    if (input.opportunityType === CareerOpportunityType.JOB) {
      input.durationMonths = null;
      input.monthlyFee = null;
    }
  }
  return input;
};

export const validateApplication = (
  body: Record<string, unknown>,
  jobId?: string,
): CreateApplicationInput => {
  const name = text(body.name, "Name") as string;
  const email = text(body.email, "Email") as string;
  if (!emailRegex.test(email))
    throw createError("Please provide a valid email address", 400);
  const resumeUrl = text(body.resumeUrl ?? body.resume, "Resume URL", false);
  if (resumeUrl && !urlRegex.test(resumeUrl))
    throw createError("Resume URL must be a valid HTTP or HTTPS URL", 400);
  return {
    jobId,
    name,
    email,
    phone: text(body.phone, "Phone", false),
    coverLetter: text(body.coverLetter, "Cover letter", false),
    resumeUrl,
  };
};

export const validateApplicationUpdate = (
  body: Record<string, unknown>,
): UpdateApplicationInput => ({
  ...(body.status !== undefined && {
    status: oneOf(
      body.status,
      Object.values(CareerApplicationStatus),
      "application status",
    ),
  }),
  ...(body.adminNote !== undefined && {
    adminNote: text(body.adminNote, "Admin note", false) ?? null,
  }),
  ...(body.paymentStatus !== undefined && {
    paymentStatus: oneOf(
      body.paymentStatus,
      Object.values(PaymentStatus),
      "payment status",
    ),
  }),
});
