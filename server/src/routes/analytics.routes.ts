import express from "express";

import { DashboardController } from "../controllers/dashboard-controller";

const router = express.Router({ mergeParams: true });

const controller = new DashboardController();

router.get("/dashboard-data", controller.getDashboardData);
router.get(
  "/current-month-contributions",
  controller.getCurrentMonthContributions
);
// savings by group
router.get("/savings-by-group", controller.getSavingsByGroup);

router.get(
  "/loans-distributions-per-group",
  controller.getLoansDistributionsPerGroup
);

export default router;
