import { Router } from "express";
import { DistrictController } from "../controllers/district-controller";
import { validateSchema } from "../middleware/validation.middleware";
import { createDistrictSchema, updateDistrictSchema } from "../validators/district.schema";
import { requireRole } from "../middleware/require-role";

const router = Router();
const districtController = new DistrictController();


// Get all districts
router.get("/", districtController.getAll);

// Get a single district
router.get("/:id", districtController.getOne);

// Create a new district (admin only)
router.post(
  "/",
  requireRole("admin"),
  validateSchema(createDistrictSchema),
  districtController.create
);

// Update a district (admin only)
router.put(
  "/:id",
  requireRole("admin"),
  validateSchema(updateDistrictSchema),
  districtController.update
);

// Delete a district (admin only)
router.delete("/:id", requireRole("admin"), districtController.delete);

export default router; 