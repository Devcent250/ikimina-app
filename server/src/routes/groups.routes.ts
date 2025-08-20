import express from "express";
import { GroupController } from "../controllers/group-controller";
import { validateSchema } from "../middleware/validation.middleware";
import { authorization } from "../middleware/auth.middleware";
import {
  createGroupSchema,
  updateGroupSchema,
} from "../validators/group.schema";
import { createBasicGroupSchema, completeGroupSchema, assignPresidentSchema } from "../validators/group-basic.schema";

const router = express.Router({ mergeParams: true });

const controller = new GroupController();

// Basic group creation (admin only) - Phase 1
router.post("/basic", authorization, validateSchema(createBasicGroupSchema), controller.createBasic);

// Assign president to basic group (admin only)
router.patch("/:id/assign-president", authorization, validateSchema(assignPresidentSchema), controller.assignPresident);

// Complete group setup (group leaders) - Phase 2  
router.patch("/:id/complete", authorization, validateSchema(completeGroupSchema), controller.completeSetup);

// Original routes (maintained for backward compatibility)
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
