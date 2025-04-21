import express from "express";
import { FineController } from "../controllers/fine-controller";
import { validateSchema } from "../middleware/validation.middleware";
import { createFineSchema, updateFineSchema } from "../validators/fine.schema";

const router = express.Router({ mergeParams: true });

const controller = new FineController();

router.post("/", validateSchema(createFineSchema), controller.create);
router.delete("/:recordId", controller.delete);
router.get("/", controller.getAll);
router.get("/:recordId", controller.getOne);
router.patch("/:recordId", validateSchema(updateFineSchema), controller.update);

export default router;
