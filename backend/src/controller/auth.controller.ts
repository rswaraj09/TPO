import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import logger from "../../utils/logger/logger";
import { sendMail } from "../lib/mail";
import {
  welcomeEmail,
  passwordResetEmail,
} from "../lib/emailTemplates";
import {
  studentSignupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../../utils/types/zodSchema";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";

const setAuthCookie = (res: Response, token: string) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: true, // MUST be true if sameSite is 'none'
    sameSite: "none", // Required for cross-origin cookies
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const signup = async (req: Request, res: Response) => {
  const parsed = studentSignupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { fullName, emailId, studentId, department, academicYear, password, contactNo } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { emailId } });
    if (existing) {
      return res.status(409).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        emailId,
        studentId,
        department,
        academicYear,
        contactNo,
        password: hashedPassword,
        role: "STUDENT",
      },
      select: { id: true, fullName: true, emailId: true },
    });

    const { subject, html } = welcomeEmail(fullName);
    await sendMail({ to: user.emailId, subject, html });

    return res.status(201).json({
      message: "Account created. Please wait for admin approval before signing in.",
    });
  } catch (error) {
    logger.error({ error }, "Signup failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const signin = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { emailId, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { emailId } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is inactive. Contact admin." });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Your account is pending admin approval.",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, emailId: user.emailId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    setAuthCookie(res, token);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        fullName: user.fullName,
        emailId: user.emailId,
        role: user.role,
        department: user.department,
        isHOD: user.isHOD,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    logger.error({ error }, "Signin failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  return res.status(200).json({ message: "Logged out" });
};

export const me = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        legalName: true,
        emailId: true,
        role: true,
        department: true,
        academicYear: true,
        studentId: true,
        profilePic: true,
        contactNo: true,
        isHOD: true,
        isVerified: true,
      },
    });
    return res.status(200).json({ user });
  } catch (error) {
    logger.error({ error }, "me failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid email" });
  }

  const { emailId } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { emailId } });
    // Always respond 200 to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        message: "If an account exists, a reset link was sent.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expires,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;
    const { subject, html } = passwordResetEmail(user.fullName, resetLink);
    await sendMail({ to: user.emailId, subject, html });

    return res.status(200).json({
      message: "If an account exists, a reset link was sent.",
    });
  } catch (error) {
    logger.error({ error }, "forgotPassword failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { token, password } = parsed.data;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    logger.error({ error }, "resetPassword failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};
