import { Request, Response } from "express";
import prisma from "../lib/prisma";
import logger from "../../utils/logger/logger";
import { sendMail } from "../lib/mail";
import { alumniInviteEmail, verificationRejectedEmail } from "../lib/emailTemplates";
import { listStudentsSchema } from "../../utils/types/zodSchema";
import { Prisma } from "../../prisma/output/prismaclient";
import { cached, invalidateCache } from "../lib/cache";
import { ChangeDiff, PROFILE_VERIFICATION_FIELDS } from "../lib/verification";
import { reviewVerificationSchema, reviewEntityFlagSchema } from "../../utils/types/zodSchema";

const STUDENT_LIST_SELECT = {
  id: true,
  fullName: true,
  legalName: true,
  emailId: true,
  contactNo: true,
  studentId: true,
  department: true,
  academicYear: true,
  avgCgpa: true,
  role: true,
  profilePic: true,
  resumeUrl: true,
  isVerified: true,
  isActive: true,
  ambassadorAssignments: {
    select: {
      id: true,
      roleName: true,
      servedAcademicYear: true,
      createdAt: true,
    },
  },
  createdAt: true,
};

export const listStudents = async (req: Request, res: Response) => {
  const parsed = listStudentsSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid filters" });
  }

  const {
    page,
    limit,
    department,
    academicYear,
    role,
    isVerified,
    isActive,
    minCgpa,
    search,
    pendingEntity,
  } = parsed.data;

  const where: Prisma.UserWhereInput = {
    role: role ?? { in: ["STUDENT", "ALUMNI"] },
  };
  if (department) where.department = department;
  if (academicYear) where.academicYear = academicYear;
  if (isVerified !== undefined) where.isVerified = isVerified;
  if (isActive !== undefined) where.isActive = isActive;
  if (minCgpa !== undefined) where.avgCgpa = { gte: minCgpa };
  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { fullName: { contains: term, mode: "insensitive" } },
      { emailId: { contains: term, mode: "insensitive" } },
      { studentId: { contains: term, mode: "insensitive" } },
    ];
  }
  if (pendingEntity === "PROFILE_OR_MARKS") {
    where.verificationRequests = {
      some: {
        status: "PENDING",
        entityType: { in: ["PROFILE", "MARKS"] },
      },
    };
  } else if (pendingEntity === "INTERNSHIP") {
    where.internships = {
      some: {
        isVerified: false,
      },
    };
  } else if (pendingEntity === "ACHIEVEMENT") {
    where.achievements = {
      some: {
        isVerified: false,
      },
    };
  }

  const cacheKey = `admin:students:list:${JSON.stringify(parsed.data)}`;

  try {
    const result = await cached(cacheKey, async () => {
      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: [{ department: "asc" }, { fullName: "asc" }],
          select: STUDENT_LIST_SELECT,
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);
      return {
        items,
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error({ error }, "listStudents failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getStudentDetail = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  try {
    const result = await cached(`student:detail:${id}`, async () => {
      const [user, marks, internships, achievements, projects, certificates, pendingVerifications] =
        await Promise.all([
          prisma.user.findFirst({
            where: { id, role: { in: ["STUDENT", "ALUMNI"] } },
            select: {
              ...STUDENT_LIST_SELECT,
              parentsContactNo: true,
              skills: true,
              socialProfile: true,
            },
          }),
          prisma.marks.findUnique({ where: { userId: id } }),
          prisma.internship.findMany({
            where: { userId: id },
            orderBy: { startDate: "desc" },
          }),
          prisma.achievement.findMany({
            where: { userId: id },
            orderBy: { createdAt: "desc" },
          }),
          prisma.project.findMany({
            where: { userId: id },
            orderBy: { createdAt: "desc" },
          }),
          prisma.certificate.findMany({
            where: { userId: id },
            orderBy: { createdAt: "desc" },
          }),
          prisma.verificationRequest.findMany({
            where: { userId: id, status: "PENDING" },
            orderBy: { createdAt: "desc" },
          }),
        ]);

      return { user, marks, internships, achievements, projects, certificates, pendingVerifications };
    });

    if (!result.user) return res.status(404).json({ message: "Student not found" });

    return res.status(200).json(result);
  } catch (error) {
    logger.error({ error }, "getStudentDetail failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const graduateStudent = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { id, role: "STUDENT" },
    });
    if (!user) return res.status(404).json({ message: "Student not found" });

    const updated = await prisma.user.update({
      where: { id },
      data: { role: "ALUMNI" },
      select: {
        id: true,
        fullName: true,
        emailId: true,
        role: true,
      },
    });

    const inviteLink = `${process.env.FRONTEND_URL}/alumni/profile`;
    const { subject, html } = alumniInviteEmail(user.fullName, inviteLink);
    await sendMail({ to: user.emailId, subject, html });

    return res.status(200).json({ user: updated });
  } catch (error) {
    logger.error({ error }, "graduateStudent failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ==================== ADMIN PENDING VERIFICATIONS ====================

const STUDENT_STUB_SELECT = {
  id: true,
  fullName: true,
  emailId: true,
  studentId: true,
  department: true,
  academicYear: true,
  profilePic: true,
};

export const listAdminPendingVerifications = async (_req: Request, res: Response) => {
  try {
    const [requests, internships, achievements, certificates] = await Promise.all([
      prisma.verificationRequest.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        include: { student: { select: STUDENT_STUB_SELECT } },
      }),
      prisma.internship.findMany({
        where: { isVerified: false },
        orderBy: { createdAt: "asc" },
        include: { student: { select: STUDENT_STUB_SELECT } },
      }),
      prisma.achievement.findMany({
        where: { isVerified: false },
        orderBy: { createdAt: "asc" },
        include: { student: { select: STUDENT_STUB_SELECT } },
      }),
      prisma.certificate.findMany({
        where: { isVerified: false },
        orderBy: { createdAt: "asc" },
        include: { student: { select: STUDENT_STUB_SELECT } },
      }),
    ]);

    const items = [
      ...requests.map((r) => ({
        kind: "VERIFICATION_REQUEST" as const,
        id: r.id,
        entityType: r.entityType,
        entityId: r.entityId,
        changes: r.changes,
        createdAt: r.createdAt,
        student: r.student,
      })),
      ...internships.map((i) => ({
        kind: "INTERNSHIP" as const,
        id: i.id,
        entityType: "INTERNSHIP" as const,
        entityId: i.id,
        data: {
          companyName: i.companyName,
          role: i.role,
          roleDescription: i.roleDescription,
          duration: i.duration,
          startDate: i.startDate,
          endDate: i.endDate,
          certificateUrl: i.certificateUrl,
          hrName: i.hrName,
          hrEmail: i.hrEmail,
          hrPhone: i.hrPhone,
        },
        createdAt: i.createdAt,
        student: i.student,
      })),
      ...achievements.map((a) => ({
        kind: "ACHIEVEMENT" as const,
        id: a.id,
        entityType: "ACHIEVEMENT" as const,
        entityId: a.id,
        data: {
          title: a.title,
          description: a.description,
          category: a.category,
          certificateUrl: a.certificateUrl,
          achievementDate: a.achievementDate,
        },
        createdAt: a.createdAt,
        student: a.student,
      })),
      ...certificates.map((c) => ({
        kind: "CERTIFICATE" as const,
        id: c.id,
        entityType: "CERTIFICATE" as const,
        entityId: c.id,
        data: {
          title: c.title,
          issuingOrg: c.issuingOrg,
          issueDate: c.issueDate,
          expiryDate: c.expiryDate,
          credentialId: c.credentialId,
          credentialUrl: c.credentialUrl,
          certificateUrl: c.certificateUrl,
        },
        createdAt: c.createdAt,
        student: c.student,
      })),
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return res.status(200).json({ items });
  } catch (error) {
    logger.error({ error }, "listAdminPendingVerifications failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ==================== ADMIN REVIEW: VerificationRequest (PROFILE / MARKS) ====================

const applyProfileDiff = async (userId: number, diff: ChangeDiff) => {
  const data: Record<string, unknown> = {};
  for (const field of PROFILE_VERIFICATION_FIELDS) {
    if (field in diff) {
      data[field] = diff[field].newValue;
    }
  }
  if (Object.keys(data).length > 0) {
    await prisma.user.update({ where: { id: userId }, data });
  }
};

const applyMarksDiff = async (userId: number, diff: ChangeDiff) => {
  const data: Record<string, unknown> = {};
  for (const [field, { newValue }] of Object.entries(diff)) {
    data[field] = newValue;
  }
  if (Object.keys(data).length === 0) return;
  await prisma.marks.update({ where: { userId }, data });

  const fresh = await prisma.marks.findUnique({ where: { userId } });
  if (!fresh) return;
  const sems = [
    fresh.sem1, fresh.sem2, fresh.sem3, fresh.sem4,
    fresh.sem5, fresh.sem6, fresh.sem7, fresh.sem8,
  ].filter((v): v is number => typeof v === "number" && v > 0);
  const avg = sems.length > 0 ? sems.reduce((a, b) => a + b, 0) / sems.length : 0;
  await prisma.user.update({ where: { id: userId }, data: { avgCgpa: Number(avg.toFixed(2)) } });
};

export const adminReviewVerificationRequest = async (req: Request, res: Response) => {
  const parsed = reviewVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const { status, remarks } = parsed.data;
  const { id } = req.params;

  try {
    const request = await prisma.verificationRequest.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "PENDING") {
      return res.status(400).json({ message: "Request already reviewed" });
    }

    const diff = (request.changes as ChangeDiff) ?? {};
    if (status === "APPROVED") {
      if (request.entityType === "PROFILE") {
        await applyProfileDiff(request.userId, diff);
      } else if (request.entityType === "MARKS") {
        await applyMarksDiff(request.userId, diff);
      }
    }

    const updated = await prisma.verificationRequest.update({
      where: { id },
      data: {
        status,
        remarks: remarks ?? null,
        reviewedById: req.user!.id,
        reviewedAt: new Date(),
      },
    });

    invalidateCache(`student:detail:${request.userId}`);

    await prisma.notification.create({
      data: {
        userId: request.userId,
        title:
          status === "APPROVED"
            ? `${request.entityType} update approved`
            : `${request.entityType} update rejected`,
        message:
          status === "APPROVED"
            ? `Your ${request.entityType.toLowerCase()} changes have been approved.`
            : `Your ${request.entityType.toLowerCase()} update was rejected.${
                remarks ? ` Remarks: ${remarks}` : ""
              }`,
        type: "VERIFICATION_RESULT",
      },
    });

    if (status === "REJECTED") {
      const { subject, html } = verificationRejectedEmail(
        request.student.fullName,
        request.entityType,
        remarks
      );
      sendMail({ to: request.student.emailId, subject, html }).catch((e) =>
        logger.error({ e }, "Verification rejected email failed")
      );
    }

    return res.status(200).json({ request: updated });
  } catch (error) {
    logger.error({ error }, "adminReviewVerificationRequest failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ==================== ADMIN REVIEW: Internship / Achievement / Certificate ====================

const adminReviewEntityFlag = async (
  req: Request,
  res: Response,
  entityType: "INTERNSHIP" | "ACHIEVEMENT" | "CERTIFICATE"
) => {
  const parsed = reviewEntityFlagSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const { isVerified, remarks } = parsed.data;
  const { id } = req.params;

  try {
    const include = { student: true } as const;
    const internship = entityType === "INTERNSHIP"
      ? await prisma.internship.findUnique({ where: { id }, include })
      : null;
    const achievement = entityType === "ACHIEVEMENT"
      ? await prisma.achievement.findUnique({ where: { id }, include })
      : null;
    const certificate = entityType === "CERTIFICATE"
      ? await prisma.certificate.findUnique({ where: { id }, include })
      : null;

    const record = internship ?? achievement ?? certificate;
    if (!record) return res.status(404).json({ message: `${entityType} not found` });

    if (entityType === "INTERNSHIP") {
      await prisma.internship.update({ where: { id }, data: { isVerified } });
    } else if (entityType === "ACHIEVEMENT") {
      await prisma.achievement.update({ where: { id }, data: { isVerified } });
    } else {
      await prisma.certificate.update({ where: { id }, data: { isVerified } });
    }

    invalidateCache(`student:detail:${record.userId}`);

    const label = entityType.charAt(0) + entityType.slice(1).toLowerCase();
    await prisma.notification.create({
      data: {
        userId: record.userId,
        title: isVerified ? `${label} verified` : `${label} rejected`,
        message: isVerified
          ? `Your ${entityType.toLowerCase()} has been verified by admin.`
          : `Your ${entityType.toLowerCase()} was rejected.${remarks ? ` Remarks: ${remarks}` : ""}`,
        type: "VERIFICATION_RESULT",
      },
    });

    if (!isVerified) {
      const { subject, html } = verificationRejectedEmail(
        record.student.fullName,
        entityType,
        remarks
      );
      sendMail({ to: record.student.emailId, subject, html }).catch((e) =>
        logger.error({ e }, `${entityType} rejected email failed`)
      );
    }

    return res.status(200).json({ message: `${entityType} updated`, isVerified });
  } catch (error) {
    logger.error({ error }, `adminReview${entityType} failed`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const adminReviewInternship = (req: Request, res: Response) =>
  adminReviewEntityFlag(req, res, "INTERNSHIP");

export const adminReviewAchievement = (req: Request, res: Response) =>
  adminReviewEntityFlag(req, res, "ACHIEVEMENT");

export const adminReviewCertificate = (req: Request, res: Response) =>
  adminReviewEntityFlag(req, res, "CERTIFICATE");
