import express from "express";
import { GroupController } from "../controllers/group-controller";
import { validateSchema } from "../middleware/validation.middleware";
import { authorization } from "../middleware/auth.middleware";
import {
  createGroupSchema,
  updateGroupSchema,
} from "../validators/group.schema";

const router = express.Router({ mergeParams: true });

const controller = new GroupController();

router.post("/", authorization, validateSchema(createGroupSchema), controller.create);
router.get(
  "/my-group",
  authorization,
  controller.getMyGroup
);
router.delete("/:recordId", authorization, controller.delete);
router.get("/", authorization, controller.getAll);
router.get("/:recordId", authorization, controller.getOne);
router.patch(
  "/:recordId",
  authorization,
  validateSchema(updateGroupSchema),
  controller.update
);

export default router;
