import { Request, Response } from "express";
import prisma from "../lib/prisma";
import logger from "../../utils/logger/logger";
import { startupSchema } from "../../utils/types/zodSchema";
import { cached, invalidateCache } from "../lib/cache";

const STARTUP_CACHE_KEY = "admin:startups:list";

export const listStartups = async (_req: Request, res: Response) => {
  try {
    const items = await cached(STARTUP_CACHE_KEY, async () =>
      prisma.startup.findMany({
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
      })
    );
    return res.status(200).json({ items });
  } catch (error) {
    logger.error({ error }, "listStartups failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createStartup = async (req: Request, res: Response) => {
  const parsed = startupSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    const startup = await prisma.startup.create({
      data: {
        ...parsed.data,
        website: parsed.data.website || null,
        contactEmail: parsed.data.contactEmail || null,
      },
    });
    invalidateCache(STARTUP_CACHE_KEY);
    return res.status(201).json({ startup });
  } catch (error) {
    logger.error({ error }, "createStartup failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStartup = async (req: Request, res: Response) => {
  const parsed = startupSchema.partial().safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const id = req.params.id;

  try {
    const existing = await prisma.startup.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Startup not found" });

    const startup = await prisma.startup.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.website !== undefined
          ? { website: parsed.data.website || null }
          : {}),
        ...(parsed.data.contactEmail !== undefined
          ? { contactEmail: parsed.data.contactEmail || null }
          : {}),
      },
    });
    invalidateCache(STARTUP_CACHE_KEY);
    return res.status(200).json({ startup });
  } catch (error) {
    logger.error({ error }, "updateStartup failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteStartup = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const existing = await prisma.startup.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Startup not found" });

    await prisma.startup.delete({ where: { id } });
    invalidateCache(STARTUP_CACHE_KEY);
    return res.status(200).json({ message: "Startup deleted" });
  } catch (error) {
    logger.error({ error }, "deleteStartup failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};
