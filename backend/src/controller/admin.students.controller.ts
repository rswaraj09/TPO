import { Request, Response } from "express";
import prisma from "../lib/prisma";
import logger from "../../utils/logger/logger";
import { sendMail } from "../lib/mail";
import { alumniInviteEmail } from "../lib/emailTemplates";
import { listStudentsSchema } from "../../utils/types/zodSchema";
import { Prisma } from "../../prisma/output/prismaclient";
import { cached } from "../lib/cache";

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
