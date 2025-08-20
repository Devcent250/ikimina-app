import express from "express";
import { RoleController } from "../controllers/role-controller";
import { validateSchema } from "../middleware/validation.middleware";
import { createRoleSchema, updateRoleSchema } from "../validators/role.schema";

const router = express.Router({ mergeParams: true });

const controller = new RoleController();

router.post("/", validateSchema(createRoleSchema), controller.create);
router.delete("/:recordId", controller.delete);
router.get("/", controller.getAll);
router.get("/:recordId", controller.getOne);
router.patch("/:recordId", validateSchema(updateRoleSchema), controller.update);

export default router;
