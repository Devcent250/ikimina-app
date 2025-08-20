import express from "express";

import {
  emailLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.schema";
import { validateSchema } from "../middleware/validation.middleware";
import { authorization } from "../middleware/auth.middleware";
import { AuthController } from "../controllers/auth";

const router = express.Router();

const controller = new AuthController();

router.get("/current", authorization, controller.currentUser);
router.post(
  "/forgot-password",
  validateSchema(forgotPasswordSchema),
  controller.forgotPassword
);
router.post(
  "/reset-password",
  validateSchema(resetPasswordSchema),
  controller.forgotPassword
);

router.post("/login", validateSchema(emailLoginSchema), controller.login);

export default router;
