import { Request, Response } from "express";
import prisma from "../lib/prisma";
import logger from "../../utils/logger/logger";
import { sendMail } from "../lib/mail";
import { applicationStatusEmail } from "../lib/emailTemplates";
import {
  jobSchema,
  updateJobSchema,
  jobStatusSchema,
  listJobsSchema,
  applicationStatusSchema,
  listApplicationsSchema,
} from "../../utils/types/zodSchema";
import { Prisma } from "../../prisma/output/prismaclient";

const JOB_SELECT = {
  id: true,
  companyName: true,
  jobTitle: true,
  description: true,
  package: true,
  location: true,
  locationType: true,
  jobType: true,
  eligibleDepartments: true,
  minCgpa: true,
  eligibleYears: true,
  deadline: true,
  rounds: true,
  openings: true,
  bondDetails: true,
  additionalNotes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  _count: { select: { applications: true } },
};

const APPLICATION_INCLUDE = {
  student: {
    select: {
      id: true,
      fullName: true,
      emailId: true,
      studentId: true,
      department: true,
      academicYear: true,
      avgCgpa: true,
      resumeUrl: true,
      profilePic: true,
    },
  },
};

const parseDeadline = (v: string): Date => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid deadline");
  return d;
};

// ==================== JOBS CRUD ====================

export const createJob = async (req: Request, res: Response) => {
  const parsed = jobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const data = parsed.data;
    const job = await prisma.job.create({
      data: {
        ...data,
        deadline: parseDeadline(data.deadline),
        createdById: req.user!.id,
        status: "OPEN",
      },
      select: JOB_SELECT,
    });

    // Find eligible students and send in-app + email broadcast
    const eligible = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        isActive: true,
        isVerified: true,
        department: { in: job.eligibleDepartments },
        academicYear: { in: job.eligibleYears },
        ...(job.minCgpa !== null ? { avgCgpa: { gte: job.minCgpa } } : {}),
      },
      select: { id: true },
    });

    if (eligible.length > 0) {
      const recipientIds = eligible.map((u) => u.id);

      await prisma.notification.createMany({
        data: recipientIds.map((uid) => ({
          userId: uid,
          title: `New job: ${job.companyName}`,
          message: `${job.companyName} is hiring for ${job.jobTitle}. Apply before ${job.deadline.toLocaleDateString()}.`,
          type: "JOB_POSTED",
          link: `/student/jobs`,
        })),
      });


    }

    return res.status(201).json({ job, eligibleCount: eligible.length });
  } catch (error) {
    logger.error({ error }, "createJob failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listJobs = async (req: Request, res: Response) => {
  const parsed = listJobsSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid filters" });
  }
  const { page, limit, status, jobType, search } = parsed.data;

  const where: Prisma.JobWhereInput = {};
  if (status) where.status = status;
  if (jobType) where.jobType = jobType;
  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { companyName: { contains: term, mode: "insensitive" } },
      { jobTitle: { contains: term, mode: "insensitive" } },
    ];
  }

  try {
    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: JOB_SELECT,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);
    return res.status(200).json({
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    logger.error({ error }, "listJobs failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getJob = async (req: Request, res: Response) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      select: JOB_SELECT,
    });
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.status(200).json({ job });
  } catch (error) {
    logger.error({ error }, "getJob failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  const parsed = updateJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const data: Prisma.JobUpdateInput = { ...parsed.data };
    if (parsed.data.deadline) {
      data.deadline = parseDeadline(parsed.data.deadline);
    }

    const job = await prisma.job.update({
      where: { id: req.params.id },
      data,
      select: JOB_SELECT,
    });
    return res.status(200).json({ job });
  } catch (error) {
    logger.error({ error }, "updateJob failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const setJobStatus = async (req: Request, res: Response) => {
  const parsed = jobStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }
  try {
    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
      select: JOB_SELECT,
    });
    return res.status(200).json({ job });
  } catch (error) {
    logger.error({ error }, "setJobStatus failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    await prisma.job.delete({ where: { id: req.params.id } });
    return res.status(200).json({ message: "Job deleted" });
  } catch (error) {
    logger.error({ error }, "deleteJob failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ==================== APPLICATIONS ====================

export const listApplications = async (req: Request, res: Response) => {
  const parsed = listApplicationsSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid filters" });
  }

  const where: Prisma.JobApplicationWhereInput = { jobId: req.params.id };
  if (parsed.data.status) where.status = parsed.data.status;

  try {
    const items = await prisma.jobApplication.findMany({
      where,
      orderBy: { appliedAt: "desc" },
      include: APPLICATION_INCLUDE,
    });
    return res.status(200).json({ items });
  } catch (error) {
    logger.error({ error }, "listApplications failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateApplicationStatus = async (req: Request, res: Response) => {
  const parsed = applicationStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    const existing = await prisma.jobApplication.findUnique({
      where: { id: req.params.id },
      include: {
        student: true,
        job: { select: { companyName: true, jobTitle: true } },
      },
    });
    if (!existing) return res.status(404).json({ message: "Application not found" });

    const updated = await prisma.jobApplication.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
      include: APPLICATION_INCLUDE,
    });

    await prisma.notification.create({
      data: {
        userId: existing.studentId,
        title: `Application: ${existing.job.companyName}`,
        message: `Your application for ${existing.job.jobTitle} is now ${parsed.data.status.replace(/_/g, " ")}.`,
        type: "APPLICATION_UPDATE",
        link: `/student/jobs`,
      },
    });

    const { subject, html } = applicationStatusEmail(
      existing.student.fullName,
      existing.job.companyName,
      existing.job.jobTitle,
      parsed.data.status
    );
    await sendMail({ to: existing.student.emailId, subject, html });

    return res.status(200).json({ application: updated });
  } catch (error) {
    logger.error({ error }, "updateApplicationStatus failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};
