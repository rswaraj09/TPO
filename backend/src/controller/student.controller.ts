import { Request, Response } from "express";
import prisma from "../lib/prisma";
import logger from "../../utils/logger/logger";
import { updateProfileSchema } from "../../utils/types/zodSchema";
import { uploadBuffer, deleteByPublicId, extractPublicIdFromUrl } from "../lib/cloudinary";
import { invalidateCache } from "../lib/cache";

const invalidateStudentCaches = (userId: number) => {
  invalidateCache(`student:detail:${userId}`);
  invalidateCache("admin:students:list:");
  invalidateCache("admin:stats");
};

const PROFILE_SELECT = {
  id: true,
  fullName: true,
  legalName: true,
  emailId: true,
  contactNo: true,
  parentsContactNo: true,
  studentId: true,
  department: true,
  academicYear: true,
  skills: true,
  socialProfile: true,
  profilePic: true,
  resumeUrl: true,
  role: true,
  isHOD: true,
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
  updatedAt: true,
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: PROFILE_SELECT });

    if (!user) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    logger.error({ error }, "getProfile failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const userId = req.user!.id;
  const payload = parsed.data as Record<string, unknown>;

  try {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!current) {
      return res.status(404).json({ message: "Profile not found" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: payload,
    });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: PROFILE_SELECT });

    invalidateStudentCaches(userId);

    return res.status(200).json({ user });
  } catch (error) {
    logger.error({ error }, "updateProfile failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const uploadProfilePic = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const userId = req.user!.id;
  try {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePic: true },
    });

    const result = await uploadBuffer(req.file.buffer, {
      folder: "tpo/profile-pics",
      resourceType: "image",
      publicId: `user-${userId}`,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { profilePic: result.secure_url },
    });

    if (current?.profilePic && current.profilePic !== result.secure_url) {
      const oldPublicId = extractPublicIdFromUrl(current.profilePic);
      if (oldPublicId && oldPublicId !== result.public_id) {
        deleteByPublicId(oldPublicId, "image").catch(() => {});
      }
    }

    invalidateStudentCaches(userId);
    return res.status(200).json({ url: result.secure_url });
  } catch (error) {
    logger.error({ error }, "uploadProfilePic failed");
    return res.status(500).json({ message: "Upload failed" });
  }
};

export const uploadResume = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const userId = req.user!.id;
  try {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { resumeUrl: true },
    });

    const result = await uploadBuffer(req.file.buffer, {
      folder: "tpo/resumes",
      resourceType: "raw",
      publicId: `resume-user-${userId}`,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { resumeUrl: result.secure_url },
    });

    if (current?.resumeUrl && current.resumeUrl !== result.secure_url) {
      const oldPublicId = extractPublicIdFromUrl(current.resumeUrl);
      if (oldPublicId && oldPublicId !== result.public_id) {
        deleteByPublicId(oldPublicId, "raw").catch(() => {});
      }
    }

    invalidateStudentCaches(userId);
    return res.status(200).json({ url: result.secure_url });
  } catch (error) {
    logger.error({ error }, "uploadResume failed");
    return res.status(500).json({ message: "Upload failed" });
  }
};

export const uploadCertificate = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const userId = req.user!.id;
  try {
    const result = await uploadBuffer(req.file.buffer, {
      folder: "tpo/certificates",
      resourceType: "raw",
      publicId: `cert-user-${userId}-${Date.now()}`,
    });
    invalidateStudentCaches(userId);
    return res.status(200).json({ url: result.secure_url });
  } catch (error) {
    logger.error({ error }, "uploadCertificate failed");
    return res.status(500).json({ message: "Upload failed" });
  }
};
