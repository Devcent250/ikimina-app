import express from "express";
import { BranchController } from "../controllers/branch-controller";
import { validateSchema } from "../middleware/validation.middleware";
import {
  createBranchSchema,
  updateBranchSchema,
} from "../validators/branch.schema";

const router = express.Router({ mergeParams: true });

const controller = new BranchController();

router.post("/", validateSchema(createBranchSchema), controller.create);
router.delete("/:recordId", controller.delete);
router.get("/", controller.getAll);
router.get("/:recordId", controller.getOne);
router.patch(
  "/:recordId",
  validateSchema(updateBranchSchema),
  controller.update
);

export default router;
