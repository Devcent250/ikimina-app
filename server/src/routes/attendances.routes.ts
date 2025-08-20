import express from "express";
import { AttendanceController } from "../controllers/attendance-controller";
import { validateSchema } from "../middleware/validation.middleware";
import {
  createAttendanceSchema,
  updateAttendanceSchema,
} from "../validators/attendance.schema";

const router = express.Router({ mergeParams: true });

const controller = new AttendanceController();

router.post("/", validateSchema(createAttendanceSchema), controller.create);
router.delete("/:recordId", controller.delete);
router.get("/", controller.getAll);
router.get("/:recordId", controller.getOne);
router.patch(
  "/:recordId",
  validateSchema(updateAttendanceSchema),
  controller.update
);

export default router;
