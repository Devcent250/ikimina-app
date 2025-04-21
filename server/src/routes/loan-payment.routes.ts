import express from "express";
import { LoanPaymentController } from "../controllers/loan-payment-controller";
import { validateSchema } from "../middleware/validation.middleware";
import {
  createLoanPaymentSchema,
  updateLoanPaymentSchema,
} from "../validators/loan-payment.schema";

const router = express.Router({ mergeParams: true });

const controller = new LoanPaymentController();

router.post("/", validateSchema(createLoanPaymentSchema), controller.create);
router.delete("/:recordId", controller.delete);
router.get("/", controller.getAll);
router.get("/:recordId", controller.getOne);
router.patch(
  "/:recordId",
  validateSchema(updateLoanPaymentSchema),
  controller.update
);

export default router;
