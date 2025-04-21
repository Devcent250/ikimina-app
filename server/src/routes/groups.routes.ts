import express from "express";
import { GroupController } from "../controllers/group-controller";
import { validateSchema } from "../middleware/validation.middleware";
import {
  createGroupSchema,
  updateGroupSchema,
} from "../validators/group.schema";

const router = express.Router({ mergeParams: true });

const controller = new GroupController();

router.post("/", validateSchema(createGroupSchema), controller.create);
router.get(
  "/my-group",
  controller.getMyGroup
);
router.delete("/:recordId", controller.delete);
router.get("/", controller.getAll);
router.get("/:recordId", controller.getOne);
router.patch(
  "/:recordId",
  validateSchema(updateGroupSchema),
  controller.update
);

export default router;
