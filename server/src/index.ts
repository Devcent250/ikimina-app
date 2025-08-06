import { AppDataSource } from "./data-source";
import express from "express";
import * as dotenv from "dotenv";
import type { Request, Response } from "express";
import "reflect-metadata";
import morgan from "morgan";
import cors from "cors";
import { errorHandler } from "./middleware/error.middleware";
import path from "path";
import fs from "fs-extra";
import multer from "multer";
import { BadRequestError } from "./errors/http.errors";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/users.routes";
import roleRoutes from "./routes/roles.routes";
import branchRoutes from "./routes/branch.routes";
import groupRoutes from "./routes/groups.routes";
import memberRoutes from "./routes/member.routes";
import groupMemberRoutes from "./routes/group-member.routes";
import seasonRoutes from "./routes/season-routes.routes";
import paymentMethodRoutes from "./routes/payment-method.routes";
import contributionRoutes from "./routes/contributions.routes";
import fineRoutes from "./routes/fines.routes";
import loanRoutes from "./routes/loans.routes";
import loanPaymentRoutes from "./routes/loan-payment.routes";
import loanVerificationRoutes from "./routes/loan-verification.routes";
import attendanceRoutes from "./routes/attendances.routes";
import expenseCategoryRoutes from "./routes/expense-category.routes";
import expenseRoutes from "./routes/expenses.routes";
import districtRoutes from "./routes/district.routes";
import { authorization } from "./middleware/auth.middleware";
import analyticsRoutes from "./routes/analytics.routes";

dotenv.config();

const delayMiddleware = (_: any, __: any, next: any) => {
  const delay = Math.floor(Math.random() * 500) + 200; // Random delay between 300ms to 1s
  setTimeout(() => {
    next();
  }, delay);
};

const app = express();

app.use(cors({
  origin: "*"
}));
app.use(express.json());
app.use(morgan("tiny"));

if (process.env.NODE_ENV === "development") {
  app.use(delayMiddleware);
}

// Serve static files from the 'public' directory
app.use(express.static("public"));

if (process.env.NODE_ENV === "production") {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, "../client")));
}

app.use("/api/auth", authRoutes);

// Nested routes for better resource hierarchy
app.use("/api/groups/:groupId/members", authorization, groupMemberRoutes);
app.use(
  "/api/groups/:groupId/contributions",
  authorization,
  contributionRoutes
);
app.use("/api/groups/:groupId/loans", authorization, loanRoutes);
app.use("/api/groups/:groupId/fines", authorization, fineRoutes);
app.use("/api/groups/:groupId/attendance", authorization, attendanceRoutes);
app.use("/api/groups/:groupId/expenses", authorization, expenseRoutes);

app.use("/api/loans/:loanId/payments", authorization, loanPaymentRoutes);
app.use("/api", authorization, loanVerificationRoutes);

app.use("/api/branches/:branchId/groups", authorization, groupRoutes);
app.use("/api/branches/:branchId/members", authorization, memberRoutes);

app.use("/api/expense-categories", authorization, expenseCategoryRoutes);
app.use("/api/payment-methods", authorization, paymentMethodRoutes);
app.use("/api/seasons", authorization, seasonRoutes);
app.use("/api/roles", authorization, roleRoutes);
app.use("/api/branches", authorization, branchRoutes);
app.use("/api/members", authorization, memberRoutes);
app.use("/api/groups", authorization, groupRoutes);
app.use("/api/contributions", authorization, contributionRoutes);
app.use("/api/loans", authorization, loanRoutes);
app.use("/api/fines", authorization, fineRoutes);
app.use("/api/users", authorization, userRoutes);
app.use("/api/expenses", authorization, expenseRoutes);
app.use("/api/districts", authorization, districtRoutes);
app.use("/api/analytics", authorization, analyticsRoutes);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "..", "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

app.use("/api/auth", authRoutes);

// Single endpoint for file upload
app.post("/api/upload", upload.single("file"), (req: any, res: Response) => {
  if (!req.file) {
    throw new BadRequestError("No file uploaded.");
  }

  // Generate the public URL for the uploaded file
  const fileUrl = `/uploads/${req.file.filename}`;

  // Return the file URL and any additional data
  res.json({
    message: "File uploaded successfully",
    fileUrl: fileUrl,
    additionalData: req.body, // Any additional form data sent with the request
  });
});

if (process.env.NODE_ENV === "production") {
  // For any request that doesn't match the above, send back React's index.html file
  app.get("*", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../client", "index.html"));
  });
} else {
  app.get("*", (req: Request, res: Response) => {
    res.status(404).json({ message: "Route not found" });
  });
}

// Single endpoint for file upload
app.post(
  "/api/upload",
  upload.single("file"),
  (req: Request, res: Response): void => {
    // @ts-ignore
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded." });
    }
    // Generate the public URL for the uploaded file
    // @ts-ignore
    const fileUrl = `/uploads/${req.file.filename}`;
    // Return the file URL and any additional data
    res.json({
      message: "File uploaded successfully",
      fileUrl: fileUrl,
      additionalData: req.body, // Any additional form data sent with the request
    });
  }
);

// Error handling middleware
// @ts-ignore
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

AppDataSource.initialize()
  .then(async () => {
    console.log("✅ Data Source Initialized");

    if (process.env.NODE_ENV === "production") {
      console.log("🚀 Running migrations...");
      await AppDataSource.runMigrations()
        .then(() => console.log("✅ Migrations complete"))
        .catch((err) => {
          console.error("❌ Migration failed", err);
          process.exit(1);
        });
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Data Source initialization failed", error);
  });
