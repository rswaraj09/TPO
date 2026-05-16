import { Request, Response } from "express";
import prisma from "../lib/prisma";
import logger from "../../utils/logger/logger";
import { ambassadorAssignmentSchema } from "../../utils/types/zodSchema";
import { cached, invalidateCache } from "../lib/cache";

const AMBASSADOR_CACHE_KEY = "admin:ambassadors:list";

const invalidateAmbassadorCaches = (studentId?: number) => {
  invalidateCache(AMBASSADOR_CACHE_KEY);
  invalidateCache("admin:students:list:");
  if (studentId) {
    invalidateCache(`student:detail:${studentId}`);
  }
};

export const listAmbassadorAssignments = async (_req: Request, res: Response) => {
  try {
    const items = await cached(AMBASSADOR_CACHE_KEY, async () =>
      prisma.ambassadorAssignment.findMany({
        orderBy: [{ servedAcademicYear: "asc" }, { roleName: "asc" }, { student: { fullName: "asc" } }],
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              emailId: true,
              studentId: true,
              department: true,
              academicYear: true,
              profilePic: true,
            },
          },
        },
      })
    );
    return res.status(200).json({ items });
  } catch (error) {
    logger.error({ error }, "listAmbassadorAssignments failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createAmbassadorAssignment = async (req: Request, res: Response) => {
  const parsed = ambassadorAssignmentSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    const student = await prisma.user.findFirst({
      where: { id: parsed.data.studentId, role: { in: ["STUDENT", "ALUMNI"] } },
      select: { id: true },
    });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const assignment = await prisma.ambassadorAssignment.create({
      data: parsed.data,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            emailId: true,
            studentId: true,
            department: true,
            academicYear: true,
            profilePic: true,
          },
        },
      },
    });
    invalidateAmbassadorCaches(parsed.data.studentId);
    return res.status(201).json({ assignment });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "This role is already assigned to the student for that academic year" });
    }
    logger.error({ error }, "createAmbassadorAssignment failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAmbassadorAssignment = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const existing = await prisma.ambassadorAssignment.findUnique({
      where: { id },
      select: { id: true, studentId: true },
    });
    if (!existing) return res.status(404).json({ message: "Assignment not found" });

    await prisma.ambassadorAssignment.delete({ where: { id } });
    invalidateAmbassadorCaches(existing.studentId);
    return res.status(200).json({ message: "Assignment removed" });
  } catch (error) {
    logger.error({ error }, "deleteAmbassadorAssignment failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};
