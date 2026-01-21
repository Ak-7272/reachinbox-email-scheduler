import { Job } from "bullmq";
import { prisma } from "../../config/db";
import { createTransporter, fromEmail } from "../../config/email";
import { redisClient } from "../../config/redis";

const MAX_EMAILS_PER_HOUR = Number(process.env.MAX_EMAILS_PER_HOUR || "200");

export async function sendEmailJobHandler(job: Job) {
  const data = job.data as { emailId?: string };

  if (!data.emailId) {
    console.error("Job missing emailId:", job.id);
    return;
  }

  const emailId = data.emailId;

  // Fetch email from DB
  const email = await prisma.email.findUnique({
    where: { id: emailId },
  });

  if (!email) {
    console.warn("Email not found for job:", job.id, "emailId:", emailId);
    return;
  }

  // Idempotency: if already sent, just return
  if (email.status === "SENT") {
    return;
  }

  const now = new Date();

  // Hourly rate limiting using Redis
  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0); // truncate to hour
  const key = `sent-count:${hourStart.toISOString()}`;

  const currentStr = await redisClient.get(key);
  const currentCount = currentStr ? parseInt(currentStr, 10) : 0;

  if (currentCount >= MAX_EMAILS_PER_HOUR) {
    // Reschedule this job to the next hour window
    const nextHour = new Date(hourStart);
    nextHour.setHours(nextHour.getHours() + 1);
    const delayMs = nextHour.getTime() - now.getTime();

    console.log(
      `Rate limit hit. Rescheduling email ${emailId} after ${delayMs} ms`
    );

    await job.moveToDelayed(delayMs);
    return;
  }

  const transporter = createTransporter();

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: email.to,
      subject: email.subject,
      text: email.body,
    });

    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: "SENT",
        sentAt: now,
      },
    });

    await redisClient.incr(key);
    await redisClient.expire(key, 60 * 60 * 2); // keep key for 2 hours

    // If this was the last email in its batch, mark batch as COMPLETED
    const remaining = await prisma.email.count({
      where: {
        batchId: email.batchId,
        status: "SCHEDULED",
      },
    });

    if (remaining === 0) {
      await prisma.emailBatch.update({
        where: { id: email.batchId },
        data: { status: "COMPLETED" },
      });
    }
  } catch (err: any) {
    console.error("Failed to send email", emailId, err);

    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: "FAILED",
        error: err?.message || "Unknown error",
      },
    });

    // Re-throw so BullMQ marks job as failed
    throw err;
  }
}
