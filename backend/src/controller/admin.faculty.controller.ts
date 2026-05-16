import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "../lib/prisma";
import logger from "../../utils/logger/logger";
import { sendMail } from "../lib/mail";
import { facultyWelcomeEmail } from "../lib/emailTemplates";
import {
  createFacultySchema,
  updateFacultySchema,
  userStatusSchema,
} from "../../utils/types/zodSchema";

const FACULTY_SELECT = {
  id: true,
  fullName: true,
  emailId: true,
  contactNo: true,
  department: true,
  isHOD: true,
  isVerified: true,
  isActive: true,
  createdAt: true,
};

export const listFaculty = async (_req: Request, res: Response) => {
  try {
    const items = await prisma.user.findMany({
      where: { role: "FACULTY" },
      orderBy: [{ department: "asc" }, { fullName: "asc" }],
      select: FACULTY_SELECT,
    });
    return res.status(200).json({ items });
  } catch (error) {
    logger.error({ error }, "listFaculty failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getFacultyDetail = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  try {
    const faculty = await prisma.user.findFirst({
      where: { id, role: "FACULTY" },
      select: FACULTY_SELECT,
    });
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    return res.status(200).json({ faculty });
  } catch (error) {
    logger.error({ error }, "getFacultyDetail failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createFaculty = async (req: Request, res: Response) => {
  const parsed = createFacultySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { fullName, emailId, contactNo, department, isHOD, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { emailId } });
    if (existing) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }

    const tempPassword = password ?? crypto.randomBytes(6).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const faculty = await prisma.user.create({
      data: {
        fullName,
        emailId,
        contactNo,
        department,
        isHOD: isHOD ?? false,
        password: hashedPassword,
        role: "FACULTY",
        isVerified: true,
        isActive: true,
      },
      select: FACULTY_SELECT,
    });

    const { subject, html } = facultyWelcomeEmail(
      fullName,
      emailId,
      tempPassword,
      isHOD ?? false
    );
    await sendMail({ to: emailId, subject, html });

    return res.status(201).json({ faculty });
  } catch (error) {
    logger.error({ error }, "createFaculty failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateFaculty = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const parsed = updateFacultySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { id, role: "FACULTY" },
    });
    if (!existing) return res.status(404).json({ message: "Faculty not found" });

    const updated = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: FACULTY_SELECT,
    });

    return res.status(200).json({ faculty: updated });
  } catch (error) {
    logger.error({ error }, "updateFaculty failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const setUserStatus = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const parsed = userStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  if (id === req.user!.id) {
    return res.status(400).json({ message: "You cannot change your own status." });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "User not found" });

    if (existing.role === "ADMIN") {
      return res.status(403).json({ message: "Cannot change status of another admin." });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
      select: {
        id: true,
        fullName: true,
        emailId: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    return res.status(200).json({ user: updated });
  } catch (error) {
    logger.error({ error }, "setUserStatus failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};
