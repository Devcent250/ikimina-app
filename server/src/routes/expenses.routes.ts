import express from "express";
import { ExpenseController } from "../controllers/expense-controller";
import { validateSchema } from "../middleware/validation.middleware";
import {
  createExpenseSchema,
  updateExpenseSchema,
} from "../validators/expense.schema";

const router = express.Router({ mergeParams: true });

const controller = new ExpenseController();

router.post("/", validateSchema(createExpenseSchema), controller.create);
router.delete("/:recordId", controller.delete);
router.get("/", controller.getAll);
router.get("/:recordId", controller.getOne);
router.patch(
  "/:recordId",
  validateSchema(updateExpenseSchema),
  controller.update
);

export default router;
