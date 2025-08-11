import express from "express";
import { LoanCategoryController } from "../controllers/loan-category-controller";
import { validateSchema } from "../middleware/validation.middleware";
import {
    createLoanCategorySchema,
    updateLoanCategorySchema,
} from "../validators/loan-category.schema";

const router = express.Router({ mergeParams: true });

const controller = new LoanCategoryController();

router.post("/", validateSchema(createLoanCategorySchema), controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.patch("/:id", validateSchema(updateLoanCategorySchema), controller.update);
router.delete("/:id", controller.delete);

export default router; 