import express from "express";
import { PaymentMethodController } from "../controllers/payment-method-controller";
import { validateSchema } from "../middleware/validation.middleware";
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
} from "../validators/payment-method.schema";

const router = express.Router({ mergeParams: true });

const controller = new PaymentMethodController();

router.post("/", validateSchema(createPaymentMethodSchema), controller.create);
router.delete("/:recordId", controller.delete);
router.get("/", controller.getAll);
router.get("/:recordId", controller.getOne);
router.patch(
  "/:recordId",
  validateSchema(updatePaymentMethodSchema),
  controller.update
);

export default router;
