import { CareerApplicationStatus, JobStatus } from "@prisma/client";
import { prisma } from "../config/database";
import {
  CreateApplicationInput,
  CreateJobInput,
  UpdateApplicationInput,
  UpdateJobInput,
} from "./careers.types";

export const createJob = (data: CreateJobInput) =>
  prisma.careerJob.create({ data });
export const listPublishedJobs = () =>
  prisma.careerJob.findMany({
    where: {
      status: JobStatus.PUBLISHED,
      OR: [{ closesAt: null }, { closesAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
  });
export const findJobBySlug = (slug: string) =>
  prisma.careerJob.findFirst({
    where: { slug, status: JobStatus.PUBLISHED },
    include: { _count: { select: { applications: true } } },
  });
export const findPublishedJobByIdentifier = (identifier: string) =>
  prisma.careerJob.findFirst({
    where: {
      status: JobStatus.PUBLISHED,
      OR: [{ id: identifier }, { slug: identifier }],
    },
    include: { _count: { select: { applications: true } } },
  });
export const listAdminJobs = (skip: number, take: number, status?: JobStatus) =>
  Promise.all([
    prisma.careerJob.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { _count: { select: { applications: true } } },
    }),
    prisma.careerJob.count({ where: status ? { status } : {} }),
  ]);
export const findJobById = (id: string) =>
  prisma.careerJob.findUnique({
    where: { id },
    include: { _count: { select: { applications: true } } },
  });
export const updateJob = (id: string, data: UpdateJobInput) =>
  prisma.careerJob.update({ where: { id }, data });
export const deleteJob = (id: string) =>
  prisma.careerJob.delete({ where: { id } });
export const createApplication = (data: CreateApplicationInput) =>
  prisma.careerApplication.create({ data });
export const listApplications = (
  skip: number,
  take: number,
  status?: CareerApplicationStatus,
) =>
  Promise.all([
    prisma.careerApplication.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { job: { select: { id: true, title: true, slug: true } } },
    }),
    prisma.careerApplication.count({ where: status ? { status } : {} }),
  ]);
export const findApplicationById = (id: string) =>
  prisma.careerApplication.findUnique({
    where: { id },
    include: { job: true },
  });
export const updateApplication = (id: string, data: UpdateApplicationInput) =>
  prisma.careerApplication.update({ where: { id }, data });
export const deleteApplication = (id: string) =>
  prisma.careerApplication.delete({ where: { id } });
