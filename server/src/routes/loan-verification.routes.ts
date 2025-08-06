import { Router } from "express";
import { LoanVerificationController } from "../controllers/loan-verification-controller";
import { authorization } from "../middleware/auth.middleware";

const router = Router();
const controller = new LoanVerificationController();

// All routes require authentication
router.use(authorization);

// Verify a loan (approve/reject)
router.post("/loans/:loanId/verify", controller.verifyLoan);

// Get verification status for a loan
router.get("/loans/:loanId/verifications", controller.getLoanVerifications);

// Get pending loans for the current leader
router.get("/loans/pending", controller.getPendingLoansForLeader);

export default router; 