import express from "express";
import { ExpenseCategoryController } from "../controllers/expense-category-controller";
import { validateSchema } from "../middleware/validation.middleware";
import {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
} from "../validators/expense-category.schema";
import upload from "../utils/upload";

const router = express.Router({ mergeParams: true });

const controller = new ExpenseCategoryController();

router.post(
  "/",
  validateSchema(createExpenseCategorySchema),
  controller.create
);
router.delete("/:recordId", controller.delete);
router.get("/", controller.getAll);
router.get("/:recordId", controller.getOne);
router.patch(
  "/:recordId",
  validateSchema(updateExpenseCategorySchema),
  controller.update
);

export default router;
