import express from "express";
import { LoanPaymentController } from "../controllers/loan-payment-controller";
import { validateSchema } from "../middleware/validation.middleware";
import {
  createLoanPaymentSchema,
  updateLoanPaymentSchema,
} from "../validators/loan-payment.schema";

const router = express.Router({ mergeParams: true });

const controller = new LoanPaymentController();

console.log("🔧 Registering loan payment routes...");

router.post("/", validateSchema(createLoanPaymentSchema), controller.create);
console.log("  ✅ POST / - Create payment");

router.delete("/:recordId", controller.delete);
console.log("  ✅ DELETE /:recordId - Delete payment");

router.get("/", controller.getAll);
console.log("  ✅ GET / - Get all payments");

router.get("/:recordId", controller.getOne);
console.log("  ✅ GET /:recordId - Get payment");

router.patch(
  "/:recordId",
  validateSchema(updateLoanPaymentSchema),
  controller.update
);
console.log("  ✅ PATCH /:recordId - Update payment");

console.log("🔧 Loan payment routes registered successfully");

export default router;
