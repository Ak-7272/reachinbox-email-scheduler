import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const {
  ETHEREAL_HOST,
  ETHEREAL_PORT,
  ETHEREAL_USER,
  ETHEREAL_PASS,
  FROM_EMAIL,
} = process.env;

if (!ETHEREAL_HOST || !ETHEREAL_PORT || !ETHEREAL_USER || !ETHEREAL_PASS || !FROM_EMAIL) {
  throw new Error("Email env vars missing in .env");
}

export const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: ETHEREAL_HOST,
    port: Number(ETHEREAL_PORT),
    secure: false,
    auth: {
      user: ETHEREAL_USER,
      pass: ETHEREAL_PASS,
    },
  });

  return transporter;
};

export const fromEmail = FROM_EMAIL;
