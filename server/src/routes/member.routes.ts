import express from "express";
import { MemberController } from "../controllers/member-controller";
import { validateSchema } from "../middleware/validation.middleware";
import {
  createMemberSchema,
  updateMemberSchema,
} from "../validators/member.schema";
import upload from "../utils/upload";

const router = express.Router({ mergeParams: true });

const controller = new MemberController();

router.post("/", validateSchema(createMemberSchema), controller.create);
router.delete("/:recordId", controller.delete);
router.get("/", controller.getAll);
router.get("/:recordId", controller.getOne);
router.patch(
  "/:recordId",
  validateSchema(updateMemberSchema),
  controller.update
);
router.post("/import", upload.single("file"), controller.import);

export default router;
