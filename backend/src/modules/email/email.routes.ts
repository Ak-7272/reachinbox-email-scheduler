import { Router } from "express";
import { prisma } from "../../config/db";
import { emailQueue } from "../../config/bullmq";

const router = Router();

// POST /api/emails/schedule
router.post("/schedule", async (req, res) => {
  try {
    const {
      subject,
      body,
      emails,
      startTime,
      delayMs,
      hourlyLimit,
    } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ message: "subject and body are required" });
    }

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: "emails must be a non-empty array" });
    }

    if (!startTime) {
      return res.status(400).json({ message: "startTime is required" });
    }

    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ message: "startTime must be a valid date" });
    }

    const delayBetween = Number(delayMs) || 2000; // default 2s
    const limitPerHour = Number(hourlyLimit || process.env.MAX_EMAILS_PER_HOUR || 200);

    // Create batch
    const batch = await prisma.emailBatch.create({
      data: {
        startTime: startDate,
        delayMs: delayBetween,
        hourlyLimit: limitPerHour,
        totalEmails: emails.length,
        status: "RUNNING",
      },
    });

    const now = new Date();
    const createdEmails: any[] = [];

    for (let i = 0; i < emails.length; i++) {
      const to = emails[i];
      if (typeof to !== "string") continue;

      const offsetMs = i * delayBetween;
      const scheduledAt = new Date(startDate.getTime() + offsetMs);

      const emailRecord = await prisma.email.create({
        data: {
          batchId: batch.id,
          to,
          subject,
          body,
          scheduledAt,
        },
      });

      const delayForQueue = Math.max(
        0,
        scheduledAt.getTime() - now.getTime()
      );

      await emailQueue.add(
        "send-email",
        { emailId: emailRecord.id },
        { delay: delayForQueue }
      );

      createdEmails.push({
        id: emailRecord.id,
        to: emailRecord.to,
        scheduledAt: emailRecord.scheduledAt,
      });
    }

    return res.status(201).json({
      message: "Emails scheduled successfully",
      batchId: batch.id,
      totalScheduled: createdEmails.length,
    });
  } catch (err: any) {
    console.error("Error in /schedule:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/emails/scheduled
router.get("/scheduled", async (_req, res) => {
  try {
    const emails = await prisma.email.findMany({
      where: { status: "SCHEDULED" },
      orderBy: { scheduledAt: "asc" },
    });

    return res.json({ emails });
  } catch (err: any) {
    console.error("Error in /scheduled:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/emails/sent
router.get("/sent", async (_req, res) => {
  try {
    const emails = await prisma.email.findMany({
      where: {
        OR: [
          { status: "SENT" },
          { status: "FAILED" },
        ],
      },
      orderBy: { sentAt: "desc" },
    });

    return res.json({ emails });
  } catch (err: any) {
    console.error("Error in /sent:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
