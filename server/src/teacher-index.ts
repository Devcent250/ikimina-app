import { TeacherDataSource } from "./teacher-data-source";
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

// Import teacher-specific routes (to be created)
// import teacherAuthRoutes from "./routes/teacher-auth.routes";
// import teacherRoutes from "./routes/teacher.routes";
// import schoolRoutes from "./routes/school.routes";
// import teacherGroupRoutes from "./routes/teacher-group.routes";
// import teacherContributionRoutes from "./routes/teacher-contribution.routes";

dotenv.config();

const delayMiddleware = (_: any, __: any, next: any) => {
  const delay = Math.floor(Math.random() * 500) + 200;
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

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

if (process.env.NODE_ENV === "production") {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, "../client")));
}

// Test endpoint to verify server is working
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "Teacher Savings Group Server is running", 
    timestamp: new Date().toISOString(),
    project: "Teacher Savings Group Management System"
  });
});

// Teacher-specific routes (to be implemented)
// app.use("/api/auth", teacherAuthRoutes);
// app.use("/api/schools", schoolRoutes);
// app.use("/api/teachers", teacherRoutes);
// app.use("/api/teacher-groups", teacherGroupRoutes);
// app.use("/api/contributions", teacherContributionRoutes);

// Debug: Log all registered routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

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

// Single endpoint for file upload
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

if (process.env.NODE_ENV === "production") {
  app.get("*", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../client", "index.html"));
  });
} else {
  app.get("*", (req: Request, res: Response) => {
    res.status(404).json({ message: "Route not found" });
  });
}

// Error handling middleware (must be last)
app.use(errorHandler as any);

const PORT = process.env.PORT || 5001;

TeacherDataSource.initialize()
  .then(async () => {
    console.log("✅ Teacher Data Source Initialized");

    if (process.env.NODE_ENV === "production") {
      console.log("🚀 Running migrations...");
      await TeacherDataSource.runMigrations()
        .then(() => console.log("✅ Migrations complete"))
        .catch((err) => {
          console.error("❌ Migration failed", err);
          process.exit(1);
        });
    }

    app.listen(PORT, () => {
      console.log(`🎓 Teacher Savings Group Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Teacher Data Source initialization failed", error);
  });
