import express from "express";
import { LoanController } from "../controllers/loan-controller";
import { validateSchema } from "../middleware/validation.middleware";
import { createLoanSchema, updateLoanSchema } from "../validators/loan.schema";
const router = express.Router({ mergeParams: true });

const controller = new LoanController();

router.post("/", validateSchema(createLoanSchema), controller.create);
router.delete("/:recordId", controller.delete);
router.get("/", controller.getAll);
router.get("/:recordId", controller.getOne);
router.patch("/:recordId", validateSchema(updateLoanSchema), controller.update);

export default router;
