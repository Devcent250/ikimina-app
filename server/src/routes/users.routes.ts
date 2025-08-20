import express from "express";
import { UserController } from "../controllers/user-controller";
import { validateSchema } from "../middleware/validation.middleware";
import { createUserSchema, updateUserSchema } from "../validators/user.schema";

const router = express.Router({ mergeParams: true });

const controller = new UserController();

router.post("/", validateSchema(createUserSchema), controller.create);
router.delete("/:recordId", controller.delete);
router.get("/", controller.getAll);
router.get("/:recordId", controller.getOne);
router.patch("/:recordId", validateSchema(updateUserSchema), controller.update);

export default router;
