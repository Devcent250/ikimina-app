import express from "express";
import { LoanController } from "../controllers/loan-controller";
import { validateSchema } from "../middleware/validation.middleware";
import { createLoanSchema, updateLoanSchema, approveLoanSchema } from "../validators/loan.schema";
const router = express.Router({ mergeParams: true });

const controller = new LoanController();

router.post("/", validateSchema(createLoanSchema), controller.create);
router.delete("/:recordId", controller.delete);
router.get("/", controller.getAll);
router.get("/:recordId", controller.getOne);
router.patch("/:recordId", validateSchema(updateLoanSchema), controller.update);

// Get maximum loan amount for a member
router.get("/max-amount/:groupMemberId/:seasonId", controller.getMaxLoanAmount);

// Loan approval routes
router.post("/:recordId/approve", validateSchema(approveLoanSchema), controller.approveLoan);
router.get("/:recordId/approval-status", controller.getLoanApprovalStatus);

export default router;
