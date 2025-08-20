import express from "express";
import { GroupMemberController } from "../controllers/group-member-controller";
import { validateSchema } from "../middleware/validation.middleware";
import {
  createGroupMemberSchema,
  updateGroupMemberSchema,
} from "../validators/group-member.schema";

const router = express.Router({ mergeParams: true });

const controller = new GroupMemberController();

router.post("/", validateSchema(createGroupMemberSchema), controller.create);
router.delete("/:recordId", controller.delete);
router.get("/", controller.getAll);
router.get("/:recordId", controller.getOne);
router.patch(
  "/:recordId",
  validateSchema(updateGroupMemberSchema),
  controller.update
);

export default router;
