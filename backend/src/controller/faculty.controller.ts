import { Request, Response } from "express";
import prisma from "../lib/prisma";
import logger from "../../utils/logger/logger";
import { sendMail } from "../lib/mail";
import { verificationRejectedEmail, verificationApprovedEmail } from "../lib/emailTemplates";
import {
  reviewVerificationSchema,
  reviewEntityFlagSchema,
  facultyListStudentsSchema,
} from "../../utils/types/zodSchema";
import {
  ChangeDiff,
  PROFILE_VERIFICATION_FIELDS,
} from "../lib/verification";
import { Prisma, Department } from "../../prisma/output/prismaclient";

const STUDENT_STUDENT_SELECT = {
  id: true,
  fullName: true,
  emailId: true,
  studentId: true,
  department: true,
  academicYear: true,
  profilePic: true,
};

const requireDept = (req: Request, res: Response): Department | null => {
  const dept = req.user?.department as Department | null | undefined;
  if (!dept) {
    res.status(400).json({ message: "Faculty account has no department assigned." });
    return null;
  }
  return dept;
};

// ==================== STATS ====================

export const getFacultyStats = async (req: Request, res: Response) => {
  const dept = requireDept(req, res);
  if (!dept) return;

  try {
    const [
      pendingVerificationRequests,
      unverifiedInternships,
      unverifiedAchievements,
      unverifiedCertificates,
      totalStudents,
      upcomingEvents,
    ] = await Promise.all([
      prisma.verificationRequest.count({
        where: {
          status: "PENDING",
          student: { department: dept, role: "STUDENT", isActive: true },
        },
      }),
      prisma.internship.count({
        where: {
          isVerified: false,
          student: { department: dept, role: "STUDENT", isActive: true },
        },
      }),
      prisma.achievement.count({
        where: {
          isVerified: false,
          student: { department: dept, role: "STUDENT", isActive: true },
        },
      }),
      prisma.certificate.count({
        where: {
          isVerified: false,
          student: { department: dept, role: "STUDENT", isActive: true },
        },
      }),
      prisma.user.count({
        where: { role: "STUDENT", department: dept, isActive: true },
      }),
      prisma.event.count({
        where: { status: "UPCOMING", eventDate: { gte: new Date() } },
      }),
    ]);

    return res.status(200).json({
      dept,
      pending: {
        profileAndMarks: pendingVerificationRequests,
        internships: unverifiedInternships,
        achievements: unverifiedAchievements,
        certificates: unverifiedCertificates,
        total: pendingVerificationRequests + unverifiedInternships + unverifiedAchievements + unverifiedCertificates,
      },
      totalStudents,
      upcomingEvents,
    });
  } catch (error) {
    logger.error({ error }, "getFacultyStats failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ==================== VERIFICATION QUEUE ====================

export const listPendingVerifications = async (req: Request, res: Response) => {
  const dept = requireDept(req, res);
  if (!dept) return;

  try {
    const [requests, internships, achievements, certificates] = await Promise.all([
      prisma.verificationRequest.findMany({
        where: {
          status: "PENDING",
          student: { department: dept, role: "STUDENT", isActive: true },
        },
        orderBy: { createdAt: "asc" },
        include: { student: { select: STUDENT_STUDENT_SELECT } },
      }),
      prisma.internship.findMany({
        where: {
          isVerified: false,
          student: { department: dept, role: "STUDENT", isActive: true },
        },
        orderBy: { createdAt: "asc" },
        include: { student: { select: STUDENT_STUDENT_SELECT } },
      }),
      prisma.achievement.findMany({
        where: {
          isVerified: false,
          student: { department: dept, role: "STUDENT", isActive: true },
        },
        orderBy: { createdAt: "asc" },
        include: { student: { select: STUDENT_STUDENT_SELECT } },
      }),
      prisma.certificate.findMany({
        where: {
          isVerified: false,
          student: { department: dept, role: "STUDENT", isActive: true },
        },
        orderBy: { createdAt: "asc" },
        include: { student: { select: STUDENT_STUDENT_SELECT } },
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
    ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return res.status(200).json({ items });
  } catch (error) {
    logger.error({ error }, "listPendingVerifications failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ==================== REVIEW: VerificationRequest (PROFILE / MARKS) ====================

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
    fresh.sem1,
    fresh.sem2,
    fresh.sem3,
    fresh.sem4,
    fresh.sem5,
    fresh.sem6,
    fresh.sem7,
    fresh.sem8,
  ].filter((v): v is number => typeof v === "number" && v > 0);

  const avg = sems.length > 0 ? sems.reduce((a, b) => a + b, 0) / sems.length : 0;
  await prisma.user.update({
    where: { id: userId },
    data: { avgCgpa: Number(avg.toFixed(2)) },
  });
};

export const reviewVerificationRequest = async (req: Request, res: Response) => {
  const dept = requireDept(req, res);
  if (!dept) return;

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
    if (request.student.department !== dept) {
      return res.status(403).json({ message: "This student is not in your department" });
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
      await sendMail({ to: request.student.emailId, subject, html });
    } else if (status === "APPROVED") {
      const { subject, html } = verificationApprovedEmail(
        request.student.fullName,
        request.entityType
      );
      await sendMail({ to: request.student.emailId, subject, html });
    }

    return res.status(200).json({ request: updated });
  } catch (error) {
    logger.error({ error }, "reviewVerificationRequest failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ==================== REVIEW: Internship / Achievement flag ====================

const reviewEntityFlag = async (
  req: Request,
  res: Response,
  entityType: "INTERNSHIP" | "ACHIEVEMENT" | "CERTIFICATE"
) => {
  const dept = requireDept(req, res);
  if (!dept) return;

  const parsed = reviewEntityFlagSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const { isVerified, remarks } = parsed.data;
  const { id } = req.params;

  try {
    const record =
      entityType === "INTERNSHIP"
        ? await prisma.internship.findUnique({ where: { id }, include: { student: true } })
        : await prisma.achievement.findUnique({ where: { id }, include: { student: true } });

    if (!record) return res.status(404).json({ message: `${entityType} not found` });
    if (record.student.department !== dept) {
      return res.status(403).json({ message: "This student is not in your department" });
    }

    if (entityType === "INTERNSHIP") {
      await prisma.internship.update({ where: { id }, data: { isVerified } });
    } else if (entityType === "ACHIEVEMENT") {
      await prisma.achievement.update({ where: { id }, data: { isVerified } });
    } else {
      await prisma.certificate.update({ where: { id }, data: { isVerified } });
    }

    await prisma.notification.create({
      data: {
        userId: record.userId,
        title: isVerified
          ? `${entityType.toLowerCase()} verified`
          : `${entityType.toLowerCase()} rejected`,
        message: isVerified
          ? `Your ${entityType.toLowerCase()} has been verified by faculty.`
          : `Your ${entityType.toLowerCase()} was rejected.${
              remarks ? ` Remarks: ${remarks}` : ""
            }`,
        type: "VERIFICATION_RESULT",
      },
    });

    if (!isVerified) {
      const { subject, html } = verificationRejectedEmail(
        record.student.fullName,
        entityType,
        remarks
      );
      await sendMail({ to: record.student.emailId, subject, html });
    } else {
      const { subject, html } = verificationApprovedEmail(
        record.student.fullName,
        entityType
      );
      await sendMail({ to: record.student.emailId, subject, html });
    }

    return res.status(200).json({ message: `${entityType} updated`, isVerified });
  } catch (error) {
    logger.error({ error }, `review ${entityType} failed`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const reviewInternship = (req: Request, res: Response) =>
  reviewEntityFlag(req, res, "INTERNSHIP");

export const reviewAchievement = (req: Request, res: Response) =>
  reviewEntityFlag(req, res, "ACHIEVEMENT");

export const reviewCertificate = (req: Request, res: Response) =>
  reviewEntityFlag(req, res, "CERTIFICATE");

// ==================== DEPT STUDENTS ====================

const DEPT_STUDENT_SELECT = {
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
  createdAt: true,
};

export const listDeptStudents = async (req: Request, res: Response) => {
  const dept = requireDept(req, res);
  if (!dept) return;

  const parsed = facultyListStudentsSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid filters" });
  }

  const { page, limit, academicYear, isVerified, isActive, minCgpa, search } = parsed.data;

  const where: Prisma.UserWhereInput = {
    role: "STUDENT",
    department: dept,
  };
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

  try {
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [{ academicYear: "asc" }, { fullName: "asc" }],
        select: DEPT_STUDENT_SELECT,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    logger.error({ error }, "listDeptStudents failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listDeptAlumni = async (req: Request, res: Response) => {
  const dept = requireDept(req, res);
  if (!dept) return;

  const parsed = facultyListStudentsSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid filters" });
  }

  const { page, limit, search } = parsed.data;

  const where: Prisma.UserWhereInput = {
    role: "ALUMNI",
    department: dept,
  };
  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { fullName: { contains: term, mode: "insensitive" } },
      { emailId: { contains: term, mode: "insensitive" } },
      { studentId: { contains: term, mode: "insensitive" } },
    ];
  }

  try {
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [{ fullName: "asc" }],
        select: {
          ...DEPT_STUDENT_SELECT,
          alumniProfile: {
            select: {
              currentOrg: true,
              currentRole: true,
              package: true,
              graduationYear: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    logger.error({ error }, "listDeptAlumni failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getDeptStudentDetail = async (req: Request, res: Response) => {
  const dept = requireDept(req, res);
  if (!dept) return;

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  try {
    const [user, marks, internships, achievements, certificates, pendingVerifications] =
      await Promise.all([
        prisma.user.findFirst({
          where: { id, role: { in: ["STUDENT", "ALUMNI"] }, department: dept },
          select: {
            ...DEPT_STUDENT_SELECT,
            parentsContactNo: true,
            skills: true,
            socialProfile: true,
            alumniProfile: {
              select: {
                currentOrg: true,
                currentRole: true,
                package: true,
                graduationYear: true,
                placedBy: true,
              },
            },
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
        prisma.certificate.findMany({
          where: { userId: id },
          orderBy: { createdAt: "desc" },
        }),
        prisma.verificationRequest.findMany({
          where: { userId: id, status: "PENDING" },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    if (!user) {
      return res
        .status(404)
        .json({ message: "Student or alumni not found in your department" });
    }

    return res.status(200).json({
      user,
      marks,
      internships,
      achievements,
      certificates,
      pendingVerifications,
    });
  } catch (error) {
    logger.error({ error }, "getDeptStudentDetail failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};
