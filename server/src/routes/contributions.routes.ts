import express from "express";
import { ContributionController } from "../controllers/contribution-controller";
import { validateSchema } from "../middleware/validation.middleware";
import {
  createContributionSchema,
  updateContributionSchema,
} from "../validators/contribution.schema";
import upload from "../utils/upload";

const router = express.Router({ mergeParams: true });

const controller = new ContributionController();

router.post("/", upload.single('documentReceipt'), validateSchema(createContributionSchema), controller.create);
router.delete("/:recordId", controller.delete);
router.get("/", controller.getAll);
router.get("/:recordId", controller.getOne);
router.patch(
  "/:recordId",
  upload.single('documentReceipt'),
  validateSchema(updateContributionSchema),
  controller.update
);

export default router;
