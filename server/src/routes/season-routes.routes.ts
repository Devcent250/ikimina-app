import express from "express";
import { SeasonController } from "../controllers/season-controller";
import { validateSchema } from "../middleware/validation.middleware";
import {
  createSeasonSchema,
  updateSeasonSchema,
} from "../validators/season.schema";

const router = express.Router({ mergeParams: true });

const controller = new SeasonController();

router.post("/", validateSchema(createSeasonSchema), controller.create);
router.delete("/:recordId", controller.delete);
router.get("/", controller.getAll);
router.get("/:recordId", controller.getOne);
router.patch(
  "/:recordId",
  validateSchema(updateSeasonSchema),
  controller.update
);

export default router;
