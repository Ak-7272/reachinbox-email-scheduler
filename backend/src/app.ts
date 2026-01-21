import express from "express";
import dotenv from "dotenv";
import emailRoutes from "./modules/email/email.routes";
import cors from "cors";

dotenv.config();

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    port: process.env.PORT || 4000,
  });
});

// Email APIs
app.use("/api/emails", emailRoutes);

export default app;
