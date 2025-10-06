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
import loanCategoryRoutes from "./routes/loan-category.routes";

dotenv.config();

// Log environment variables for debugging
console.log("🔍 NODE_ENV:", process.env.NODE_ENV);
if (process.env.DATABASE_URL) {
  console.log("🔍 DATABASE_URL: SET");
  console.log("🔍 DATABASE_URL starts with:", process.env.DATABASE_URL.substring(0, 15) + "...");
} else {
  console.log("❌ DATABASE_URL: NOT SET");
}
console.log("🔍 FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("🔍 PORT:", process.env.PORT || 5000);

const delayMiddleware = (_: any, __: any, next: any) => {
  const delay = Math.floor(Math.random() * 500) + 200;
  setTimeout(() => {
    next();
  }, delay);
};

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? process.env.FRONTEND_URL || "https://vjnikibina.infinityconect.com"
    : "*",
  credentials: true
}));
app.use(express.json());
app.use(morgan("tiny"));

if (process.env.NODE_ENV === "development") {
  app.use(delayMiddleware);
}

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

// REMOVED: React static file serving since we have separate frontend service

app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: 'Ikimina Backend API Server is running', 
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    service: 'main-ikimina-backend',
    port: process.env.PORT || 5000
  });
});

// Health check for load balancers/orchestrators
app.get("/health", (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'ikimina-backend'
  });
});

// Test endpoint to verify server is working
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is running", timestamp: new Date().toISOString() });
});

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
console.log("✅ Loan payment routes mounted at /api/loans/:loanId/payments");

app.use("/api", authorization, loanVerificationRoutes);

// Debug: Log all registered routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

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
app.use("/api/loan-categories", authorization, loanCategoryRoutes);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "..", "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// Single endpoint for file upload (REMOVED DUPLICATE)
app.post("/api/upload", upload.single("file"), (req: any, res: Response) => {
  if (!req.file) {
    throw new BadRequestError("No file uploaded.");
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    message: "File uploaded successfully",
    fileUrl: fileUrl,
    additionalData: req.body,
  });
});

// REMOVED: React catch-all route since we have separate frontend service

// Handle undefined routes
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({ 
    message: "Route not found",
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware (must be last)
app.use(errorHandler as any);

const PORT = process.env.PORT || 5000;

AppDataSource.initialize()
  .then(async () => {
    console.log("✅ Data Source Initialized");

    if (process.env.NODE_ENV === "production") {
      console.log("🚀 Running migrations...");
      try {
        const migrations = await AppDataSource.runMigrations();
        console.log(`✅ Migrations complete. Executed ${migrations.length} migrations.`);
        migrations.forEach(migration => {
          console.log(`  - ${migration.name}`);
        });
      } catch (err) {
        console.error("❌ Migration failed:", err);
        console.error("Migration error details:", {
          message: (err as Error).message,
          stack: (err as Error).stack
        });
        process.exit(1);
      }
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Health check available at: /health`);
      console.log(`📊 API endpoints available at: /api/*`);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      process.exit(0);
    });
  })
  .catch((error) => {
    console.error("❌ Data Source initialization failed", error);
    process.exit(1);
  });
