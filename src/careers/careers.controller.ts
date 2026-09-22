import { Request, Response, NextFunction } from "express";
import { CareerApplicationStatus, JobStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { createError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { deletePrivateFile, getPrivateFileUrl, uploadPrivateFile } from "../services/r2Service";
import {
  createApplication,
  createJob,
  deleteApplication,
  deleteJob,
  findApplicationById,
  findJobById,
  findPublishedJobByIdentifier,
  listAdminJobs,
  listApplications,
  listPublishedJobs,
  updateApplication,
  updateJob,
} from "./careers.service";
import {
  validateApplication,
  validateApplicationUpdate,
  validateCreateJob,
  validateUpdateJob,
} from "./careers.validation";

const pagination = (req: Request) => {
  const page = Math.max(parseInt(String(req.query.page || "1"), 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(String(req.query.limit || "10"), 10) || 10, 1),
    100,
  );
  return { page, limit, skip: (page - 1) * limit };
};

const status = <T extends string>(
  value: unknown,
  values: readonly T[],
  field: string,
): T | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !values.includes(value as T))
    throw createError(`Invalid ${field}`, 400);
  return value as T;
};

const submitApplication = async (req: Request, jobId?: string) => {
  const applicationData = validateApplication(req.body, jobId);
  const file = req.file;
  const paymentProofKey = file
    ? `career-payment-proofs/${new Date().getUTCFullYear()}/${randomUUID()}${file.originalname.substring(file.originalname.lastIndexOf("."))}`
    : undefined;

  try {
    if (file && paymentProofKey) await uploadPrivateFile(file, paymentProofKey);
    return await createApplication({
      ...applicationData,
      ...(file && paymentProofKey && {
        paymentProofKey,
        paymentProofOriginalName: file.originalname,
        paymentProofMimeType: file.mimetype,
        paymentProofSize: file.size,
        paymentStatus: "PENDING_VERIFICATION" as const,
      }),
    });
  } catch (error) {
    if (paymentProofKey) await deletePrivateFile(paymentProofKey).catch(() => undefined);
    throw error;
  }
};

export const getJobs = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.json({ success: true, data: await listPublishedJobs() });
  } catch (error) {
    next(error);
  }
};

export const getJobBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const job = await findPublishedJobByIdentifier(req.params.slug);
    if (!job) throw createError("Job not found", 404);
    res.json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

export const submitJobApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const job = await findJobById(req.params.jobId);
    const deadline = job?.deadline ?? job?.closesAt;
    if (
      !job ||
      job.status !== JobStatus.PUBLISHED ||
      (deadline && deadline <= new Date())
    )
      throw createError("Job is not accepting applications", 404);
    const application = await submitApplication(req, job.id);
    logger.info(`Career application received: ${application.id}`);
    res
      .status(201)
      .json({
        success: true,
        message: "Application submitted successfully",
        data: { id: application.id },
      });
  } catch (error) {
    next(error);
  }
};

export const submitGeneralApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const application = await submitApplication(req);
    logger.info(`General career application received: ${application.id}`);
    res
      .status(201)
      .json({
        success: true,
        message: "Application submitted successfully",
        data: { id: application.id },
      });
  } catch (error) {
    next(error);
  }
};

export const createAdminJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res
      .status(201)
      .json({
        success: true,
        data: await createJob(validateCreateJob(req.body)),
      });
  } catch (error) {
    next(error);
  }
};

export const getAdminJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, skip } = pagination(req);
    const requestedStatus = status(
      req.query.status,
      Object.values(JobStatus),
      "job status",
    );
    const [jobs, total] = await listAdminJobs(skip, limit, requestedStatus);
    res.json({
      success: true,
      data: jobs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const job = await findJobById(req.params.id);
    if (!job) throw createError("Job not found", 404);
    res.json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

export const updateAdminJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const existingJob = await findJobById(req.params.id);
    if (!existingJob)
      throw createError("Job not found", 404);
    const currentJob = {
      ...existingJob,
      monthlyFee: existingJob.monthlyFee?.toNumber() ?? null,
    };
    res.json({
      success: true,
      data: await updateJob(
        req.params.id,
        validateUpdateJob(req.body, currentJob),
      ),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!(await findJobById(req.params.id)))
      throw createError("Job not found", 404);
    await deleteJob(req.params.id);
    res.json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getAdminApplications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, skip } = pagination(req);
    const requestedStatus = status(
      req.query.status,
      Object.values(CareerApplicationStatus),
      "application status",
    );
    const [applications, total] = await listApplications(
      skip,
      limit,
      requestedStatus,
    );
    res.json({
      success: true,
      data: applications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const application = await findApplicationById(req.params.id);
    if (!application) throw createError("Application not found", 404);
    const paymentProofUrl = application.paymentProofKey
      ? await getPrivateFileUrl(application.paymentProofKey)
      : undefined;
    res.json({ success: true, data: { ...application, paymentProofUrl } });
  } catch (error) {
    next(error);
  }
};

export const updateAdminApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!(await findApplicationById(req.params.id)))
      throw createError("Application not found", 404);
    res.json({
      success: true,
      data: await updateApplication(
        req.params.id,
        validateApplicationUpdate(req.body),
      ),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const application = await findApplicationById(req.params.id);
    if (!application)
      throw createError("Application not found", 404);
    await deleteApplication(req.params.id);
    if (application.paymentProofKey)
      await deletePrivateFile(application.paymentProofKey).catch((error) => {
        logger.warn(`Failed to delete payment proof for application ${req.params.id}`, error);
      });
    res.json({ success: true, message: "Application deleted successfully" });
  } catch (error) {
    next(error);
  }
};
